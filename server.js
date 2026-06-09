const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Serve SkyFrame_Prototype.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'SkyFrame_Prototype.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

// ── QuickBooks config ──────────────────────────────────────────────────────────
const CLIENT_ID     = 'AB5rzyr0kAxWrTNQHzlNiriDy7IR9g6kvAsQAvgEkf98PAveO2';
const CLIENT_SECRET = 'hclfqM8JaK7Ab62eLKMqZlAzS0j3sMP5sgaEav2B';
const REDIRECT_URI  = 'http://localhost:3000/callback';
const QBO_BASE      = 'https://sandbox-quickbooks.api.intuit.com';

// In-memory token store (POC only)
let tokens      = null;
let oauthState  = null;

// ── Orders tracking ────────────────────────────────────────────────────────────
let sentInvoices = []; // { invoiceId, docNumber, clientName, total, createdAt }
let paidOrders   = []; // { orderId, invoiceId, docNumber, clientName, total, paidAt }

// ── Mailer setup (Ethereal test account) ──────────────────────────────────────
let transporter = null;

nodemailer.createTestAccount().then(account => {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass },
  });
  console.log(`✓ Mail ready — inbox: https://ethereal.email/messages (${account.user})`);
}).catch(err => console.error('Mail setup failed:', err.message));

// ── OAuth routes ───────────────────────────────────────────────────────────────

// Step 1 — redirect user to Intuit authorization page
app.get('/auth/quickbooks', (req, res) => {
  oauthState = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    response_type: 'code',
    scope:         'com.intuit.quickbooks.accounting',
    redirect_uri:  REDIRECT_URI,
    state:         oauthState,
  });
  res.redirect(`https://appcenter.intuit.com/connect/oauth2?${params}`);
});

// Step 2 — Intuit redirects back here with ?code=...&realmId=...
app.get('/callback', async (req, res) => {
  const { code, state, realmId } = req.query;

  if (!code || state !== oauthState) {
    return res.redirect('/?qbo=error');
  }

  try {
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenRes  = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }).toString(),
      { headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    tokens = {
      access_token:  tokenRes.data.access_token,
      refresh_token: tokenRes.data.refresh_token,
      realm_id:      realmId,
      expires_at:    Date.now() + tokenRes.data.expires_in * 1000,
    };

    console.log(`✓ QuickBooks connected — realmId: ${realmId}`);
    res.redirect('/?qbo=connected');
  } catch (err) {
    console.error('OAuth callback error:', err.response?.data || err.message);
    res.redirect('/?qbo=error');
  }
});

// ── API routes ─────────────────────────────────────────────────────────────────

app.get('/api/qbo-status', (req, res) => {
  res.json({ connected: !!tokens });
});

app.post('/api/create-invoice', async (req, res) => {
  if (!tokens) {
    return res.status(401).json({ error: 'QuickBooks not connected. Please connect first.' });
  }

  // Refresh access token if it expires within the next minute
  if (Date.now() > tokens.expires_at - 60_000) {
    try {
      await refreshAccessToken();
    } catch (err) {
      tokens = null;
      return res.status(401).json({ error: 'Session expired — please reconnect QuickBooks.' });
    }
  }

  const { customerName = 'Walk-in Client', lines = [], total, quoteId } = req.body;
  const { access_token, realm_id } = tokens;
  const headers = {
    Authorization:  `Bearer ${access_token}`,
    Accept:         'application/json',
    'Content-Type': 'application/json',
  };

  try {
    const customerId = await findOrCreateCustomer(customerName, realm_id, headers);
    const itemId     = await findServiceItem(realm_id, headers);

    const invoiceLines = lines
      .filter(l => l.amount > 0)
      .map(l => ({
        Amount:     parseFloat(l.amount),
        Description: l.description,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef:    { value: itemId },
          Qty:        1,
          UnitPrice:  parseFloat(l.amount),
        },
      }));

    if (invoiceLines.length === 0) {
      return res.status(400).json({ error: 'No line items with amounts to invoice.' });
    }

    const invoiceRes = await axios.post(
      `${QBO_BASE}/v3/company/${realm_id}/invoice?minorversion=65`,
      { CustomerRef: { value: customerId }, Line: invoiceLines },
      { headers },
    );

    const invoice   = invoiceRes.data.Invoice;
    const invoiceId = invoice.Id;
    const docNumber = invoice.DocNumber || invoiceId;
    const viewUrl   = `https://app.sandbox.qbo.intuit.com/app/invoice?txnId=${invoiceId}`;

    // Track for paid-order polling
    sentInvoices.push({ invoiceId, docNumber, clientName: customerName, total: invoice.TotalAmt, createdAt: new Date(), quoteId: quoteId || null });

    console.log(`✓ Invoice created — #${docNumber} ($${total})`);
    res.json({ success: true, invoiceId: docNumber, viewUrl });
  } catch (err) {
    console.error('Invoice creation error:', err.response?.data || err.message);
    const message = err.response?.data?.Fault?.Error?.[0]?.Message || err.message;
    res.status(500).json({ error: message });
  }
});

// ── Send quote email ──────────────────────────────────────────────────────────

app.post('/api/send-quote-email', async (req, res) => {
  if (!transporter) return res.status(503).json({ error: 'Mail transport not ready — please retry in a moment.' });

  const { to, customerName, artDescription, artSize, lines = [], subtotal, discount, tax, total } = req.body;
  if (!to) return res.status(400).json({ error: 'No recipient email address.' });

  try {
    const info = await transporter.sendMail({
      from:    '"SkyFrame Quotes" <quotes@skyframe.com>',
      to,
      subject: `Your SkyFrame Quote — $${Number(total).toFixed(2)}`,
      html:    buildQuoteEmail({ customerName, artDescription, artSize, lines, subtotal, discount, tax, total }),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`✓ Quote emailed to ${to} — preview: ${previewUrl}`);
    res.json({ success: true, previewUrl });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function buildQuoteEmail({ customerName, artDescription, artSize, lines, subtotal, discount, tax, total }) {
  const lineRows = lines.map(l => `
    <tr>
      <td style="padding:11px 12px;border-bottom:1px solid #E5E3DF;color:#1A1A1A;font-size:13px;">${l.description}</td>
      <td style="padding:11px 12px;border-bottom:1px solid #E5E3DF;text-align:right;color:#1A1A1A;font-size:13px;">$${Number(l.amount).toFixed(2)}</td>
    </tr>`).join('');

  const artBlock = (artDescription && artDescription !== '—') ? `
    <div style="padding:0 40px 28px;">
      <h3 style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#C9A86A;font-family:Georgia,serif;">Artwork</h3>
      <p style="margin:0 0 4px;font-size:13px;color:#4A4845;">Description: ${artDescription}</p>
      ${artSize && artSize !== '—' ? `<p style="margin:0;font-size:13px;color:#4A4845;">Size: ${artSize}</p>` : ''}
    </div>` : '';

  const discountRow = Number(discount) > 0 ? `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;font-size:13px;color:#059669;">Discount</td>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;text-align:right;font-size:13px;color:#059669;">-$${Number(discount).toFixed(2)}</td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 0;background:#F0EEEB;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

  <div style="background:#1A1A1A;padding:36px;text-align:center;border-bottom:3px solid #C9A86A;">
    <h1 style="margin:0;color:#C9A86A;font-size:30px;letter-spacing:.12em;font-family:Georgia,serif;">SKYFRAME</h1>
    <p style="margin:8px 0 0;color:#8A8784;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Custom Framing & Fine Art Printing</p>
  </div>

  <div style="padding:36px 40px 20px;">
    <p style="margin:0 0 8px;font-size:15px;color:#1A1A1A;">Dear ${customerName},</p>
    <p style="margin:0;font-size:13px;color:#4A4845;line-height:1.6;">Thank you for your interest in SkyFrame. Please find your custom framing quote below.</p>
  </div>

  ${artBlock}

  <div style="padding:0 40px 32px;">
    <h3 style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#C9A86A;font-family:Georgia,serif;">Quote Breakdown</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#1A1A1A;">
          <th style="padding:10px 12px;text-align:left;color:#FAF8F5;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">Item</th>
          <th style="padding:10px 12px;text-align:right;color:#FAF8F5;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">Amount</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;font-size:13px;color:#4A4845;">Subtotal</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;text-align:right;font-size:13px;color:#4A4845;">$${Number(subtotal).toFixed(2)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;font-size:13px;color:#4A4845;">NY Tax (8.875%)</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E3DF;text-align:right;font-size:13px;color:#4A4845;">$${Number(tax).toFixed(2)}</td>
      </tr>
    </table>
    <div style="background:#1A1A1A;padding:16px 12px;display:flex;justify-content:space-between;margin-top:2px;">
      <span style="color:#FAF8F5;font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:.06em;">Total Due</span>
      <span style="color:#C9A86A;font-weight:bold;font-size:20px;">$${Number(total).toFixed(2)}</span>
    </div>
  </div>

  <div style="padding:0 40px 32px;text-align:center;">
    <p style="font-size:12px;color:#8A8784;line-height:1.6;margin:0;">This quote is valid for 30 days from the date of issue.<br>To approve or discuss, simply reply to this email.</p>
  </div>

  <div style="background:#F0EEEB;padding:20px;text-align:center;border-top:1px solid #E5E3DF;">
    <p style="margin:0;color:#8A8784;font-size:11px;">SkyFrame · 141 W 28th St, New York, NY 10001 · (212) 925-7856</p>
    <p style="margin:4px 0 0;color:#8A8784;font-size:11px;">quotes@skyframe.com</p>
  </div>

</div>
</body></html>`;
}

// ── PDF preview ───────────────────────────────────────────────────────────────

app.post('/api/preview-pdf', (req, res) => {
  const { clientName, artDescription, artSize, lines = [], subtotal, discount, tax, total, quoteNum } = req.body;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${quoteNum}.pdf"`);
  doc.pipe(res);

  const W      = doc.page.width;
  const M      = 50;
  const CW     = W - M * 2;
  const GOLD   = '#C9A86A';
  const BLACK  = '#1A1A1A';
  const OFFWHT = '#FAF8F5';
  const GRAY   = '#8A8784';
  const DGRAY  = '#4A4845';
  const LGRAY  = '#E5E3DF';
  const GREEN  = '#059669';
  const amtX   = W - M - 90;

  // ── Header bar
  doc.rect(0, 0, W, 78).fill(BLACK);
  doc.fontSize(26).font('Helvetica-Bold').fillColor(GOLD).text('SKYFRAME', M, 24);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(OFFWHT).text(quoteNum, amtX, 22, { width: 90, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(today, amtX, 38, { width: 90, align: 'right' });
  doc.rect(0, 78, W, 3).fill(GOLD);

  let y = 108;

  // ── Section helper
  const sectionLabel = (label) => {
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GRAY).text(label, M, y);
    y += 13;
    doc.rect(M, y, CW, 0.75).fill(LGRAY);
    y += 12;
  };

  // ── Client & Artwork
  sectionLabel('CLIENT & ARTWORK');
  const col2 = M + CW / 2;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('CLIENT', M, y);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('ART SIZE', col2, y);
  y += 13;
  doc.fontSize(12).font('Helvetica').fillColor(BLACK).text(clientName || 'Walk-in Client', M, y, { width: CW / 2 - 10 });
  doc.fontSize(12).font('Helvetica').fillColor(BLACK).text(artSize || '—', col2, y);
  y += 24;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('ART DESCRIPTION', M, y);
  y += 13;
  doc.fontSize(11).font('Helvetica').fillColor(BLACK).text(artDescription || '—', M, y, { width: CW });
  y += doc.heightOfString(artDescription || '—', { width: CW }) + 24;

  // ── Quote breakdown
  sectionLabel('QUOTE BREAKDOWN');
  lines.forEach(l => {
    if (!l.amount || l.amount <= 0) return;
    doc.fontSize(11).font('Helvetica').fillColor(BLACK).text(l.description, M, y, { width: amtX - M - 10 });
    doc.fontSize(11).font('Helvetica').fillColor(BLACK).text('$' + Number(l.amount).toFixed(2), amtX, y, { width: 90, align: 'right' });
    y += 20;
    doc.rect(M, y, CW, 0.5).fill(LGRAY);
    y += 8;
  });

  // Subtotal
  y += 4;
  doc.rect(M, y, CW, 1).fill(BLACK); y += 9;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DGRAY).text('Subtotal', M, y);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DGRAY).text('$' + Number(subtotal).toFixed(2), amtX, y, { width: 90, align: 'right' });
  y += 19;
  doc.rect(M, y, CW, 1).fill(BLACK); y += 10;

  // Discount (only when non-zero)
  const discountVal = Number(discount);
  if (discountVal > 0) {
    doc.fontSize(11).font('Helvetica').fillColor(GREEN).text('Discount', M, y);
    doc.fontSize(11).font('Helvetica').fillColor(GREEN).text('-$' + discountVal.toFixed(2), amtX, y, { width: 90, align: 'right' });
    y += 20;
    doc.rect(M, y, CW, 0.5).fill(LGRAY); y += 10;
  }

  // Tax
  doc.fontSize(11).font('Helvetica').fillColor(DGRAY).text('NY Tax (8.875%)', M, y);
  doc.fontSize(11).font('Helvetica').fillColor(DGRAY).text('$' + Number(tax).toFixed(2), amtX, y, { width: 90, align: 'right' });
  y += 28;

  // Grand total block
  doc.rect(M, y, CW, 54).fill(BLACK);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(OFFWHT).text('TOTAL DUE', M + 18, y + 17);
  doc.fontSize(24).font('Helvetica-Bold').fillColor(GOLD).text('$' + Number(total).toFixed(2), amtX - 10, y + 12, { width: 100, align: 'right' });

  // Footer
  const footerY = doc.page.height - 55;
  doc.rect(0, footerY, W, 0.75).fill(LGRAY);
  doc.fontSize(8.5).font('Helvetica').fillColor(GRAY).text(
    'SkyFrame Platform  ·  This quote is valid for 30 days  ·  quotes@skyframe.com',
    M, footerY + 14, { width: CW, align: 'center' },
  );

  doc.end();
});

// ── Paid-invoice polling ───────────────────────────────────────────────────────

async function pollPaidInvoices() {
  if (!tokens || sentInvoices.length === 0) return;

  const alreadyPaid = new Set(paidOrders.map(o => o.invoiceId));
  const unpaid = sentInvoices.filter(inv => !alreadyPaid.has(inv.invoiceId));
  if (unpaid.length === 0) return;

  // Refresh token if close to expiry
  if (Date.now() > tokens.expires_at - 60_000) {
    try { await refreshAccessToken(); } catch { return; }
  }

  const headers = {
    Authorization:  `Bearer ${tokens.access_token}`,
    Accept:         'application/json',
    'Content-Type': 'application/json',
  };

  for (const inv of unpaid) {
    try {
      const r = await axios.get(
        `${QBO_BASE}/v3/company/${tokens.realm_id}/invoice/${inv.invoiceId}?minorversion=65`,
        { headers },
      );
      const qboInvoice = r.data.Invoice;
      if (Number(qboInvoice.Balance) === 0 && Number(qboInvoice.TotalAmt) > 0) {
        const order = {
          orderId:    'ORD-' + (2000 + paidOrders.length + 1),
          invoiceId:  inv.invoiceId,
          docNumber:  inv.docNumber,
          clientName: inv.clientName,
          total:      qboInvoice.TotalAmt,
          paidAt:     new Date(),
          status:     'Paid',
          quoteId:    inv.quoteId || null,
        };
        paidOrders.push(order);
        console.log(`✓ Order ${order.orderId} created from paid invoice #${inv.docNumber} (${inv.clientName})`);
      }
    } catch (err) {
      console.warn(`Poll: could not check invoice ${inv.invoiceId} —`, err.response?.status || err.message);
    }
  }
}

// Poll every 15 seconds
setInterval(pollPaidInvoices, 15_000);

// GET /api/orders — return dynamically tracked paid orders
app.get('/api/orders', (req, res) => {
  res.json({ orders: paidOrders });
});

// POST /api/poll-now — trigger an immediate check (useful during testing)
app.post('/api/poll-now', async (req, res) => {
  await pollPaidInvoices();
  res.json({ orders: paidOrders, checked: sentInvoices.length });
});

// ── Monday.com integration ─────────────────────────────────────────────────────
const MONDAY_TOKEN    = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY2ODcyNDY5MywiYWFpIjoxMSwidWlkIjoxMDUxNTM0MjYsImlhZCI6IjIwMjYtMDYtMDlUMTI6MzE6MzQuMDU2WiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM1NTIzODU5LCJyZ24iOiJldWMxIn0.jzSLarPSDrIpz9_FZt5Z6zvO6i4XXWhgdnklZsBHFdw';
const MONDAY_BOARD_ID = 5098206899;
const MONDAY_API      = 'https://api.monday.com/v2';

// Tracked Monday items: { mondayItemId, orderId, lastMondayStatus }
let mondayTracked = [];

const mondayHeaders = {
  Authorization: MONDAY_TOKEN,
  'Content-Type': 'application/json',
  'API-Version':  '2024-01',
};

app.post('/api/send-to-monday', async (req, res) => {
  const { orderId, clientName, description, total, status, date } = req.body;

  const itemName     = `${orderId} — ${clientName}`;
  const columnValues = JSON.stringify({
    status: { label: 'Working on it' },   // "Working on it" — standard Monday default
  });

  const query = `
    mutation {
      create_item(
        board_id: ${MONDAY_BOARD_ID},
        item_name: ${JSON.stringify(itemName)},
        column_values: ${JSON.stringify(columnValues)}
      ) { id name }
    }`;

  try {
    const response = await axios.post(MONDAY_API, { query }, { headers: mondayHeaders });

    const errors = response.data.errors;
    if (errors?.length > 0) {
      console.error('Monday API errors:', errors);
      return res.status(400).json({ error: errors[0].message });
    }

    const item = response.data.data?.create_item;
    mondayTracked.push({ mondayItemId: item.id, orderId, lastMondayStatus: 'Working on it' });
    console.log(`✓ Monday task created — #${item.id} "${item.name}"`);
    res.json({
      success:      true,
      mondayItemId: item.id,
      itemName:     item.name,
      mondayStatus: 'Working on it',
    });
  } catch (err) {
    console.error('Monday.com error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

// Return current statuses for all tracked Monday items
app.get('/api/monday-status', (req, res) => {
  res.json({ tracked: mondayTracked });
});

// Poll Monday for status changes every 20 seconds
async function pollMondayStatuses() {
  if (mondayTracked.length === 0) return;
  const ids = mondayTracked.map(t => t.mondayItemId).join(', ');
  const query = `{ items(ids: [${ids}]) { id column_values(ids: ["status"]) { text } } }`;
  try {
    const response = await axios.post(MONDAY_API, { query }, { headers: mondayHeaders });
    const items = response.data.data?.items || [];
    items.forEach(item => {
      const entry  = mondayTracked.find(t => t.mondayItemId === item.id);
      if (!entry) return;
      const label  = item.column_values[0]?.text || '';
      if (label && label !== entry.lastMondayStatus) {
        console.log(`↻ Monday #${item.id} (${entry.orderId}): "${entry.lastMondayStatus}" → "${label}"`);
        entry.lastMondayStatus = label;
      }
    });
  } catch (err) {
    // silent — poll will retry
  }
}
setInterval(pollMondayStatuses, 20_000);

// ── TrackPod integration ───────────────────────────────────────────────────────
const TRACKPOD_API_KEY = process.env.TRACKPOD_API_KEY || '019ea821-d811-701e-91e6-46a1191d65a5';
const TRACKPOD_BASE    = 'https://api.track-pod.com';

// Randomised pools — change every request so test orders look distinct
const TP_ADDRESSES = [
  '980 Madison Ave, New York, NY 10075',
  '1071 5th Ave, New York, NY 10128',
  '417 Park Ave, New York, NY 10022',
  '660 Madison Ave, New York, NY 10065',
  '11 W 53rd St, New York, NY 10019',
  '200 Park Ave, New York, NY 10166',
  '345 Hudson St, New York, NY 10014',
  '520 W 45th St, New York, NY 10036',
];
const TP_WINDOWS = [
  { from: '08:00', to: '11:00' },
  { from: '09:00', to: '12:00' },
  { from: '10:00', to: '14:00' },
  { from: '12:00', to: '15:00' },
  { from: '13:00', to: '17:00' },
  { from: '15:00', to: '18:00' },
];
const TP_COMMENTS = [
  'Handle with care — fragile artwork, custom framing.',
  'White-glove delivery required. Call 30 min before arrival.',
  'Leave with doorman if no answer. Ask for art storage room.',
  'Client prefers afternoon slot. Ring buzzer code #412.',
  'Oversized package — two-person delivery team required.',
  'Deliver to receiving dock on side street entrance.',
  'Fragile glass — do not stack. Client will be home all day.',
  'Call ahead: +1-212-555-0100. Elevator access only.',
];

// Tracked TrackPod orders: { orderId, trackpodNumber, lastStatus }
let trackpodTracked = [];

const trackpodHeaders = {
  'X-Api-Key':    TRACKPOD_API_KEY,
  'Content-Type': 'application/json',
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

app.post('/api/send-to-trackpod', async (req, res) => {
  const { orderId, clientName, description, total, date } = req.body;

  const window  = pick(TP_WINDOWS);
  const address = pick(TP_ADDRESSES);
  const comment = pick(TP_COMMENTS);
  const today   = new Date().toISOString().slice(0, 10);
  const article = 'FRM-' + orderId.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const payload = {
    number:      orderId,
    date:        today,
    client:      clientName,       // TrackPod uses 'client', not 'clientName'
    clientPhone: '+1-212-555-0199',
    address,
    timeFrom:    window.from,
    timeTo:      window.to,
    comment,
    goods: [
      {
        article,
        description: description || 'Custom Framing Order',
        quantity:    1,
      },
    ],
  };

  try {
    const response = await axios.post(
      `${TRACKPOD_BASE}/order`,
      payload,       // TrackPod expects a single order object
      {
        headers: {
          'X-Api-Key':    TRACKPOD_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(`✓ TrackPod order sent — ${orderId} | ${address} | ${window.from}–${window.to}`);
    // Start tracking this order for status polling
    trackpodTracked.push({ orderId, trackpodNumber: orderId, lastStatus: '' });
    res.json({
      success:  true,
      orderId,
      address,
      timeFrom: window.from,
      timeTo:   window.to,
      comment,
      trackpodRef: null,
    });
  } catch (err) {
    const data   = err.response?.data;
    const status = err.response?.status;
    const msg    = data?.Detail || data?.message || (typeof data === 'string' ? data : null) || err.message;
    console.error(`TrackPod error [${status}]:`, msg);
    res.status(500).json({ error: msg, statusCode: status });
  }
});

// GET /api/trackpod-status — return current statuses for all tracked TrackPod orders
app.get('/api/trackpod-status', (req, res) => {
  res.json({ tracked: trackpodTracked });
});

// Poll TrackPod for status changes every 30 seconds
async function pollTrackpodStatuses() {
  if (trackpodTracked.length === 0) return;
  for (const entry of trackpodTracked) {
    try {
      const r = await axios.get(
        `${TRACKPOD_BASE}/Order/Number/${encodeURIComponent(entry.trackpodNumber)}`,
        { headers: trackpodHeaders },
      );
      const status = r.data?.Status || '';
      if (status && status !== entry.lastStatus) {
        console.log(`↻ TrackPod ${entry.trackpodNumber} (${entry.orderId}): "${entry.lastStatus || 'New'}" → "${status}"`);
        entry.lastStatus = status;
      }
    } catch (err) {
      // silent — poll will retry
    }
  }
}
setInterval(pollTrackpodStatuses, 30_000);

// ── Helpers ────────────────────────────────────────────────────────────────────

async function refreshAccessToken() {
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }).toString(),
    { headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  tokens.access_token  = res.data.access_token;
  tokens.refresh_token = res.data.refresh_token;
  tokens.expires_at    = Date.now() + res.data.expires_in * 1000;
}

async function findOrCreateCustomer(displayName, realmId, headers) {
  const safe  = displayName.replace(/'/g, "\\'");
  const query = `SELECT * FROM Customer WHERE DisplayName = '${safe}' MAXRESULTS 1`;
  const qRes  = await axios.get(
    `${QBO_BASE}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`,
    { headers },
  );

  const existing = qRes.data.QueryResponse?.Customer;
  if (existing && existing.length > 0) return existing[0].Id;

  // Customer not found — create them
  const cRes = await axios.post(
    `${QBO_BASE}/v3/company/${realmId}/customer?minorversion=65`,
    { DisplayName: displayName },
    { headers },
  );
  return cRes.data.Customer.Id;
}

async function findServiceItem(realmId, headers) {
  const query = `SELECT * FROM Item WHERE Type = 'Service' MAXRESULTS 1`;
  const qRes  = await axios.get(
    `${QBO_BASE}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`,
    { headers },
  );

  const items = qRes.data.QueryResponse?.Item;
  if (items && items.length > 0) return items[0].Id;

  throw new Error('No Service items found in QuickBooks. Please create one in your QBO sandbox first.');
}

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(3000, () => {
  console.log('SkyFrame server running → http://localhost:3000');
  console.log('Connect QuickBooks  → http://localhost:3000/auth/quickbooks');
});

/**
 * SkyFrame Platform — Weekly QA Report
 * 
 * Runs every Saturday at 6am GMT+2 via GitHub Actions.
 * Checks the codebase for common issues and emails a report.
 * 
 * Usage:
 *   node scripts/qa-report.js
 * 
 * Required env vars:
 *   REPORT_EMAIL_TO    - recipient email (otar.beridze@itechcraft.com)
 *   SMTP_HOST          - SMTP server host
 *   SMTP_PORT          - SMTP port (587)
 *   SMTP_USER          - SMTP username
 *   SMTP_PASS          - SMTP password
 *   SMTP_FROM          - sender address
 */

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..');
const REPORT_TO   = process.env.REPORT_EMAIL_TO || 'otar.beridze@itechcraft.com';
const REPORT_DATE = new Date().toISOString().split('T')[0];
const REPORT_FILE = path.join(ROOT, 'docs', 'reports', `${REPORT_DATE}-qa-report.md`);

// ─── HELPERS ─────────────────────────────────────────────
function readFile(relPath) {
  try { return fs.readFileSync(path.join(ROOT, relPath), 'utf8'); }
  catch { return null; }
}

function icon(pass) { return pass ? '✅' : '❌'; }

// ─── CHECKS ──────────────────────────────────────────────
const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, ...result });
  } catch (err) {
    checks.push({ name, pass: false, detail: `Error: ${err.message}` });
  }
}

// 1. server.js exists and has content
check('server.js exists', () => {
  const content = readFile('server.js');
  if (!content) return { pass: false, detail: 'server.js not found' };
  return { pass: content.length > 100, detail: `${content.split('\n').length} lines` };
});

// 2. All required API routes present
check('API routes — QB OAuth', () => {
  const content = readFile('server.js');
  const hasAuth     = content.includes('/auth/quickbooks');
  const hasCallback = content.includes('/callback');
  const hasInvoice  = content.includes('/api/create-invoice');
  const pass = hasAuth && hasCallback && hasInvoice;
  return { pass, detail: pass ? 'All QB routes present' : 'Missing: ' + [!hasAuth && '/auth/quickbooks', !hasCallback && '/callback', !hasInvoice && '/api/create-invoice'].filter(Boolean).join(', ') };
});

check('API routes — TrackPod', () => {
  const content = readFile('server.js');
  const hasSend   = content.includes('/api/send-to-trackpod');
  const hasStatus = content.includes('/api/trackpod-status');
  const pass = hasSend && hasStatus;
  return { pass, detail: pass ? 'All TrackPod routes present' : 'Missing routes' };
});

check('API routes — Monday.com', () => {
  const content = readFile('server.js');
  const hasSend   = content.includes('/api/send-to-monday');
  const hasStatus = content.includes('/api/monday-status');
  const pass = hasSend && hasStatus;
  return { pass, detail: pass ? 'All Monday routes present' : 'Missing routes' };
});

check('API routes — Email/PDF', () => {
  const content = readFile('server.js');
  const hasEmail = content.includes('/api/send-quote-email');
  const hasPdf   = content.includes('/api/preview-pdf');
  return { pass: hasEmail && hasPdf, detail: hasEmail && hasPdf ? 'Email and PDF routes present' : 'Missing routes' };
});

// 3. Hardcoded credentials (security)
check('Security — no hardcoded QB secret', () => {
  const content = readFile('server.js');
  // Check if secret value (not the env var reference) is hardcoded
  const hasHardcoded = content.includes('hclfqM8J') || content.includes('AB5rzyr0kAxW');
  return {
    pass: !hasHardcoded,
    detail: hasHardcoded
      ? '⚠️  QuickBooks CLIENT_ID/SECRET still hardcoded — move to .env'
      : 'QB credentials not hardcoded'
  };
});

check('Security — no hardcoded TrackPod key', () => {
  const content = readFile('server.js');
  const hasHardcoded = content.includes('019e6dc3-64d3-7f95');
  return {
    pass: !hasHardcoded,
    detail: hasHardcoded
      ? '⚠️  TrackPod API key still hardcoded — move to .env'
      : 'TrackPod key not hardcoded'
  };
});

// 4. Error handling
check('Error handling — try/catch in async routes', () => {
  const content = readFile('server.js');
  const asyncRoutes = (content.match(/async \(req, res\)/g) || []).length;
  const tryCatches  = (content.match(/try \{/g) || []).length;
  const pass = tryCatches >= asyncRoutes * 0.8; // at least 80% covered
  return {
    pass,
    detail: `${tryCatches} try/catch blocks for ${asyncRoutes} async routes`
  };
});

// 5. Polling intervals
check('Polling — QB payment check configured', () => {
  const content = readFile('server.js');
  const hasPolling = content.includes('setInterval') && content.includes('15');
  return { pass: hasPolling, detail: hasPolling ? 'QB polling (15s) configured' : 'QB polling not found' };
});

check('Polling — TrackPod status configured', () => {
  const content = readFile('server.js');
  const hasPolling = content.includes('setInterval') && content.includes('trackpod');
  return { pass: hasPolling, detail: hasPolling ? 'TrackPod polling configured' : 'TrackPod polling not found' };
});

// 6. Dependencies
check('.env.example up to date', () => {
  const envExample = readFile('.env.example');
  if (!envExample) return { pass: false, detail: '.env.example not found' };
  const hasQB      = envExample.includes('QB_CLIENT_ID');
  const hasTP      = envExample.includes('TRACKPOD_API_KEY');
  const hasMonday  = envExample.includes('MONDAY_API_KEY');
  const pass = hasQB && hasTP && hasMonday;
  return { pass, detail: pass ? 'All integrations documented' : 'Missing entries in .env.example' };
});

check('package.json has required dependencies', () => {
  const pkg = readFile('package.json');
  if (!pkg) return { pass: false, detail: 'package.json not found' };
  const p = JSON.parse(pkg);
  const required = ['express', 'nodemailer', 'pdfkit', 'axios'];
  const missing = required.filter(dep => !p.dependencies?.[dep]);
  return {
    pass: missing.length === 0,
    detail: missing.length === 0 ? 'All dependencies present' : `Missing: ${missing.join(', ')}`
  };
});

// 7. Prototype HTML
check('Prototype HTML exists', () => {
  const content = readFile('public/SkyFrame_Prototype.html');
  if (!content) return { pass: false, detail: 'SkyFrame_Prototype.html not found in public/' };
  const lines = content.split('\n').length;
  return { pass: lines > 1000, detail: `${lines} lines` };
});

check('Prototype — pricing function present', () => {
  const content = readFile('public/SkyFrame_Prototype.html');
  const hasUpdatePrice = content?.includes('function updatePrice()');
  return { pass: !!hasUpdatePrice, detail: hasUpdatePrice ? 'updatePrice() found' : 'updatePrice() missing — pricing engine broken' };
});

check('Prototype — QB save button wired', () => {
  const content = readFile('public/SkyFrame_Prototype.html');
  const hasSave = content?.includes('create-invoice') || content?.includes('saveConfiguration') || content?.includes('Save Configuration');
  return { pass: !!hasSave, detail: hasSave ? 'Save Configuration button present' : 'Save button not found' };
});

// 8. CLAUDE.md present
check('Claude Code config — CLAUDE.md exists', () => {
  const content = readFile('CLAUDE.md');
  return { pass: !!content, detail: content ? `${content.split('\n').length} lines` : 'CLAUDE.md missing' };
});

check('Claude Code config — agents present', () => {
  const agents = ['architect', 'reviewer', 'security', 'qa', 'pricing-logic'];
  const missing = agents.filter(a => !fs.existsSync(path.join(ROOT, `.claude/agents/${a}.md`)));
  return {
    pass: missing.length === 0,
    detail: missing.length === 0 ? `All ${agents.length} agents present` : `Missing agents: ${missing.join(', ')}`
  };
});

// ─── REPORT GENERATION ───────────────────────────────────
const passed = checks.filter(c => c.pass).length;
const failed = checks.filter(c => !c.pass).length;
const total  = checks.length;
const score  = Math.round((passed / total) * 100);

const statusEmoji = score === 100 ? '🟢' : score >= 80 ? '🟡' : '🔴';

const reportMd = `# SkyFrame Platform — QA Report
**Date:** ${REPORT_DATE}  
**Score:** ${statusEmoji} ${score}% (${passed}/${total} checks passed)

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | ${passed} |
| ❌ Failed | ${failed} |
| Total | ${total} |

---

## Results

${checks.map(c => `### ${icon(c.pass)} ${c.name}
${c.detail}
`).join('\n')}

---

## Action Items

${failed === 0
  ? '✅ No issues found. All checks passed!'
  : checks.filter(c => !c.pass).map((c, i) => `${i + 1}. **${c.name}** — ${c.detail}`).join('\n')
}

---

*Generated automatically every Saturday 6:00 AM GMT+2*  
*SkyFrame Platform QA Report — github.com/OtarBeridze/skyframe-platform*
`;

// Save report
const reportsDir = path.join(ROOT, 'docs', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(REPORT_FILE, reportMd);
console.log(`✓ Report saved: ${REPORT_FILE}`);
console.log(`  Score: ${score}% (${passed}/${total})`);

// ─── EMAIL ────────────────────────────────────────────────
async function sendReport() {
  const nodemailer = require('nodemailer');

  let transporter;

  // Use real SMTP if configured, otherwise fall back to Ethereal
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Ethereal test account
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: account.user, pass: account.pass }
    });
    console.log(`  Using Ethereal test email. Inbox: https://ethereal.email/messages`);
  }

  const htmlReport = reportMd
    .replace(/## /g, '<h2>')
    .replace(/### /g, '<h3>')
    .replace(/✅/g, '<span style="color:green">✅</span>')
    .replace(/❌/g, '<span style="color:red">❌</span>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"SkyFrame QA Bot" <qa@skyframe.dev>',
    to: REPORT_TO,
    subject: `${statusEmoji} SkyFrame QA Report — ${REPORT_DATE} — ${score}% (${passed}/${total})`,
    text: reportMd,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: #c9a96e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SkyFrame Platform</h1>
          <p style="margin: 4px 0 0; color: #888;">Weekly QA Report — ${REPORT_DATE}</p>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <div style="background: ${score === 100 ? '#e8f5e9' : score >= 80 ? '#fff9c4' : '#ffebee'}; 
                      padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px;">${statusEmoji}</div>
            <div style="font-size: 32px; font-weight: bold;">${score}%</div>
            <div style="color: #666;">${passed} of ${total} checks passed</div>
          </div>
          ${failed > 0 ? `
          <div style="background: #fff3f3; border-left: 4px solid #f44336; padding: 12px; margin-bottom: 20px;">
            <strong>Action Required:</strong><br>
            ${checks.filter(c => !c.pass).map(c => `• ${c.name}: ${c.detail}`).join('<br>')}
          </div>` : ''}
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #1a1a1a; color: white;">
                <th style="padding: 8px 12px; text-align: left;">Check</th>
                <th style="padding: 8px 12px; text-align: left;">Detail</th>
              </tr>
            </thead>
            <tbody>
              ${checks.map((c, i) => `
              <tr style="background: ${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 8px 12px;">${icon(c.pass)} ${c.name}</td>
                <td style="padding: 8px 12px; color: #666;">${c.detail}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  });

  console.log(`✓ Report emailed to: ${REPORT_TO}`);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`  Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

sendReport().catch(err => {
  console.error('Failed to send email:', err.message);
  process.exit(1);
});

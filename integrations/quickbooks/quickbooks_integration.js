/**
 * SkyFrame → QuickBooks Online Integration POC
 * 
 * Demonstrates end-to-end flow:
 * 1. Find or create customer in QuickBooks
 * 2. Create invoice from SkyFrame order data
 * 3. Send invoice email
 * 
 * Prerequisites:
 *   - QuickBooks Developer account
 *   - OAuth 2.0 tokens (see QuickBooks_Setup_Guide.md)
 *   - npm install node-fetch
 * 
 * Usage:
 *   cp ../../.env.example ../../.env  # fill in credentials
 *   node quickbooks_integration.js
 */

const BASE_URL = process.env.QB_ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

// ============================================
// SAMPLE ORDER DATA (from SkyFrame Configurator)
// ============================================
const sampleOrder = {
  orderId: 'SF-2026-0847',
  client: {
    name: 'Gagosian Gallery',
    email: 'orders@gagosian.com',
    phone: '212-555-0180',
    address: {
      line1: '980 Madison Avenue',
      city: 'New York',
      state: 'NY',
      zip: '10075',
      country: 'US'
    }
  },
  orderDetails: {
    artDescription: 'Oil on canvas, 24x36 inches',
    frame: 'Classic Black Oak',
    matting: '4-ply White',
    glazing: 'Museum Glass',
    mounting: 'Drymount'
  },
  pricing: {
    printing: 45.00,
    frame: 120.00,
    matting: 35.00,
    glazing: 80.00,
    mounting: 25.00,
    oversizeSurcharge: 0.00,
    subtotal: 305.00,
    markup: 85.40,      // 28%
    tax: 34.72,          // 8.875% NY
    total: 425.12
  }
};

// ============================================
// API HELPERS
// ============================================

async function qboRequest(method, endpoint, accessToken, realmId, body = null) {
  const url = `${BASE_URL}/v3/company/${realmId}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`QBO API Error ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

async function findOrCreateCustomer(client, accessToken, realmId) {
  console.log(`\n[1/3] Finding customer: ${client.name}...`);
  
  // Search for existing customer
  const query = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${client.name}'`);
  const result = await qboRequest('GET', `/query?query=${query}`, accessToken, realmId);
  
  if (result.QueryResponse?.Customer?.length > 0) {
    const existing = result.QueryResponse.Customer[0];
    console.log(`  ✓ Found existing customer (ID: ${existing.Id})`);
    return existing.Id;
  }
  
  // Create new customer
  console.log('  → Creating new customer...');
  const newCustomer = await qboRequest('POST', '/customer', accessToken, realmId, {
    DisplayName: client.name,
    PrimaryEmailAddr: { Address: client.email },
    PrimaryPhone: { FreeFormNumber: client.phone },
    BillAddr: {
      Line1: client.address.line1,
      City: client.address.city,
      CountrySubDivisionCode: client.address.state,
      PostalCode: client.address.zip,
      Country: client.address.country
    }
  });
  
  console.log(`  ✓ Created customer (ID: ${newCustomer.Customer.Id})`);
  return newCustomer.Customer.Id;
}

// ============================================
// INVOICE CREATION
// ============================================

async function createInvoice(order, customerId, accessToken, realmId) {
  console.log(`\n[2/3] Creating invoice for order ${order.orderId}...`);
  
  const lineItems = [
    { desc: `Printing - ${order.orderDetails.artDescription}`, amount: order.pricing.printing },
    { desc: `Frame - ${order.orderDetails.frame}`, amount: order.pricing.frame },
    { desc: `Matting - ${order.orderDetails.matting}`, amount: order.pricing.matting },
    { desc: `Glazing - ${order.orderDetails.glazing}`, amount: order.pricing.glazing },
    { desc: `Mounting - ${order.orderDetails.mounting}`, amount: order.pricing.mounting },
    { desc: 'Oversize Surcharge', amount: order.pricing.oversizeSurcharge },
    { desc: 'Markup (28%)', amount: order.pricing.markup },
  ].filter(item => item.amount > 0);
  
  const invoice = await qboRequest('POST', '/invoice', accessToken, realmId, {
    CustomerRef: { value: customerId },
    DocNumber: order.orderId,
    Line: lineItems.map(item => ({
      DetailType: 'SalesItemLineDetail',
      Amount: item.amount,
      Description: item.desc,
      SalesItemLineDetail: {
        ItemRef: { value: '1', name: 'Services' }, // Default service item
        Qty: 1,
        UnitPrice: item.amount
      }
    })),
    TxnTaxDetail: {
      TotalTax: order.pricing.tax
    },
    PrivateNote: `SkyFrame Order: ${order.orderId}`
  });
  
  console.log(`  ✓ Invoice created (ID: ${invoice.Invoice.Id}, #${invoice.Invoice.DocNumber})`);
  console.log(`  → Total: $${invoice.Invoice.TotalAmt}`);
  return invoice.Invoice;
}

// ============================================
// SEND INVOICE EMAIL
// ============================================

async function sendInvoiceEmail(invoiceId, accessToken, realmId) {
  console.log(`\n[3/3] Sending invoice email...`);
  
  const response = await qboRequest('POST', `/invoice/${invoiceId}/send`, accessToken, realmId);
  console.log('  ✓ Invoice email sent');
  return response;
}

// ============================================
// MAIN WORKFLOW
// ============================================

async function processOrder(accessToken, realmId) {
  console.log('===========================================');
  console.log('  SKYFRAME → QUICKBOOKS INTEGRATION POC');
  console.log('===========================================\n');
  
  console.log('Order Details:');
  console.log(`  Order ID: ${sampleOrder.orderId}`);
  console.log(`  Client: ${sampleOrder.client.name}`);
  console.log(`  Description: ${sampleOrder.orderDetails.artDescription}`);
  console.log(`  Total: $${sampleOrder.pricing.total}`);
  console.log('\n-------------------------------------------');

  try {
    const customerId = await findOrCreateCustomer(sampleOrder.client, accessToken, realmId);
    const invoice = await createInvoice(sampleOrder, customerId, accessToken, realmId);
    await sendInvoiceEmail(invoice.Id, accessToken, realmId);
    
    console.log('\n===========================================');
    console.log('  ✓ ORDER PROCESSED SUCCESSFULLY!');
    console.log('===========================================');
    console.log(`\nQuickBooks Invoice URL:`);
    console.log(`  https://app.sandbox.qbo.intuit.com/app/invoice?txnId=${invoice.Id}`);
    
    return { success: true, invoiceId: invoice.Id, invoiceNumber: invoice.DocNumber, customerId };
  } catch (error) {
    console.error('\n===========================================');
    console.error('  ✗ ERROR PROCESSING ORDER');
    console.error('===========================================');
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// RUN
// ============================================

if (require.main === module) {
  // In production, these come from OAuth flow
  const accessToken = process.env.QB_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
  const realmId = process.env.QB_REALM_ID || 'YOUR_REALM_ID';
  
  if (accessToken === 'YOUR_ACCESS_TOKEN') {
    console.log('⚠ No access token found. Complete OAuth flow first.');
    console.log('  See: QuickBooks_Setup_Guide.md');
    process.exit(1);
  }
  
  processOrder(accessToken, realmId).then(result => {
    console.log('\nFinal Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { processOrder, findOrCreateCustomer, createInvoice, sendInvoiceEmail };

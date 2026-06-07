/**
 * SkyFrame — TrackPod API Integration Test
 * 
 * Tests all key endpoints to validate API key and connectivity.
 * Uses Node 18+ fetch (no external dependencies).
 * 
 * Usage:
 *   node trackpod-api-test.js
 * 
 * API Key is loaded from ../../.env (TRACKPOD_API_KEY) or falls back to hardcoded value.
 */

const API_KEY = process.env.TRACKPOD_API_KEY || '019e6dc3-64d3-7f95-85cd-654902a8f516';
const BASE_URL = process.env.TRACKPOD_BASE_URL || 'https://api.track-pod.com';

const results = {};
const delay = ms => new Promise(r => setTimeout(r, ms));

// ============================================
// API HELPER
// ============================================

async function apiCall(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  let data = null;
  
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  
  return { status: response.status, ok: response.ok, data };
}

// ============================================
// TEST FUNCTIONS
// ============================================

async function testAuth() {
  console.log('\n[1/6] Testing API Key authentication...');
  try {
    const res = await apiCall('GET', '/Driver');
    if (res.status === 401 || res.status === 403) {
      console.log('  ✗ Authentication FAILED (invalid API key)');
      results.auth = { pass: false, detail: `HTTP ${res.status}` };
      return false;
    }
    console.log(`  ✓ Authentication OK (HTTP ${res.status})`);
    results.auth = { pass: true, detail: `HTTP ${res.status}` };
    return true;
  } catch (err) {
    console.log(`  ✗ Connection error: ${err.message}`);
    results.auth = { pass: false, detail: err.message };
    return false;
  }
}

async function testGetOrders() {
  console.log('\n[2/6] Testing GET /Order (last 30 days)...');
  try {
    const now = new Date();
    const from = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const dateFrom = from.toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];
    
    const res = await apiCall('GET', `/Order?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    
    if (!res.ok) {
      console.log(`  ✗ Failed (HTTP ${res.status})`);
      results.getOrders = { pass: false, detail: `HTTP ${res.status}`, count: 0 };
      return;
    }
    
    const orders = Array.isArray(res.data) ? res.data : [];
    console.log(`  ✓ Success — ${orders.length} order(s) found`);
    
    if (orders.length > 0) {
      console.log('  First orders:');
      orders.slice(0, 3).forEach(o => {
        console.log(`    • #${o.number || o.Number || '?'} — ${o.clientName || o.ClientName || '?'} — Status: ${o.status || o.Status || '?'}`);
      });
    }
    
    results.getOrders = { pass: true, detail: `${orders.length} orders`, count: orders.length };
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.getOrders = { pass: false, detail: err.message, count: 0 };
  }
}

async function testGetRoutes() {
  console.log('\n[3/6] Testing GET /Route (last 30 days)...');
  try {
    const now = new Date();
    const from = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const dateFrom = from.toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];
    
    const res = await apiCall('GET', `/Route?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    
    if (!res.ok) {
      console.log(`  ✗ Failed (HTTP ${res.status})`);
      results.getRoutes = { pass: false, detail: `HTTP ${res.status}`, count: 0 };
      return;
    }
    
    const routes = Array.isArray(res.data) ? res.data : [];
    console.log(`  ✓ Success — ${routes.length} route(s) found`);
    
    if (routes.length > 0) {
      console.log('  First routes:');
      routes.slice(0, 3).forEach(r => {
        console.log(`    • Code: ${r.code || r.Code || '?'} — Date: ${r.date || r.Date || '?'}`);
      });
    }
    
    results.getRoutes = { pass: true, detail: `${routes.length} routes`, count: routes.length };
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.getRoutes = { pass: false, detail: err.message, count: 0 };
  }
}

async function testGetDrivers() {
  console.log('\n[4/6] Testing GET /Driver...');
  try {
    const res = await apiCall('GET', '/Driver');
    
    if (!res.ok) {
      console.log(`  ✗ Failed (HTTP ${res.status})`);
      results.getDrivers = { pass: false, detail: `HTTP ${res.status}`, count: 0 };
      return;
    }
    
    const drivers = Array.isArray(res.data) ? res.data : [];
    console.log(`  ✓ Success — ${drivers.length} driver(s) found`);
    
    if (drivers.length > 0) {
      console.log('  Drivers:');
      drivers.slice(0, 5).forEach(d => {
        console.log(`    • ${d.name || d.Name || '?'} — Phone: ${d.phone || d.Phone || '?'} — Active: ${d.active ?? d.Active ?? '?'}`);
      });
    }
    
    results.getDrivers = { pass: true, detail: `${drivers.length} drivers`, count: drivers.length };
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.getDrivers = { pass: false, detail: err.message, count: 0 };
  }
}

async function testCreateOrder() {
  console.log('\n[5/6] Testing POST /Order (create test order)...');
  
  const testOrder = {
    number: `SF-TEST-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    clientName: 'SkyFrame Test Client',
    clientPhone: '+1-212-555-0199',
    address: '980 Madison Ave, New York, NY 10075',
    timeFrom: '10:00',
    timeTo: '14:00',
    comment: 'API integration test from SkyFrame Platform. Safe to delete.',
    goods: [
      {
        article: 'FRM-TEST-24x36',
        description: 'Test Frame 24x36',
        quantity: 1
      }
    ]
  };
  
  try {
    const res = await apiCall('POST', '/Order', testOrder);
    
    if (!res.ok) {
      console.log(`  ✗ Failed (HTTP ${res.status})`);
      if (res.data) console.log(`    Response: ${JSON.stringify(res.data).slice(0, 200)}`);
      results.createOrder = { pass: false, detail: `HTTP ${res.status}` };
      return null;
    }
    
    const orderId = res.data?.id || res.data?.Id || res.data;
    console.log(`  ✓ Order created (ID: ${orderId}, #${testOrder.number})`);
    results.createOrder = { pass: true, detail: `ID: ${orderId}` };
    return { id: orderId, number: testOrder.number };
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.createOrder = { pass: false, detail: err.message };
    return null;
  }
}

async function testDeleteOrder(orderId) {
  console.log('\n[6/6] Testing DELETE /Order (cleanup test order)...');
  
  if (!orderId) {
    console.log('  ⊘ Skipped (no order to delete)');
    results.deleteOrder = { pass: false, detail: 'Skipped — no order created' };
    return;
  }
  
  try {
    const res = await apiCall('DELETE', `/Order/${orderId}`);
    
    if (!res.ok) {
      console.log(`  ✗ Failed (HTTP ${res.status})`);
      results.deleteOrder = { pass: false, detail: `HTTP ${res.status}` };
      return;
    }
    
    console.log(`  ✓ Test order deleted (ID: ${orderId})`);
    results.deleteOrder = { pass: true, detail: `Deleted ID: ${orderId}` };
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.deleteOrder = { pass: false, detail: err.message };
  }
}

// ============================================
// SUMMARY TABLE
// ============================================

function printSummary() {
  const icon = pass => pass ? '✅' : '❌';
  const pad = (str, len) => str.padEnd(len);
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║           TRACK-POD API TEST RESULTS                ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  
  const rows = [
    ['Auth (API Key valid)', results.auth],
    ['GET Orders', results.getOrders],
    ['GET Routes', results.getRoutes],
    ['GET Drivers', results.getDrivers],
    ['POST Order (create)', results.createOrder],
    ['DELETE Order (cleanup)', results.deleteOrder],
  ];
  
  for (const [label, r] of rows) {
    const status = r ? `${icon(r.pass)}  (${r.detail})` : '⊘  (not tested)';
    console.log(`║  ${pad(label, 26)} ${status.padEnd(26)} ║`);
  }
  
  console.log('╚══════════════════════════════════════════════════════╝');
  
  const total = Object.values(results).filter(r => r?.pass).length;
  const tested = Object.values(results).length;
  console.log(`\n  Result: ${total}/${tested} tests passed`);
  
  if (total === tested) {
    console.log('  🎉 All tests passed! TrackPod integration is feasible.');
  } else {
    console.log('  ⚠ Some tests failed. Check errors above.');
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function main() {
  console.log('===========================================');
  console.log('  SKYFRAME — TRACK-POD API TEST SUITE');
  console.log('===========================================');
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  API Key  : ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`  Date     : ${new Date().toISOString().split('T')[0]}`);
  
  const authOk = await testAuth();
  
  if (!authOk) {
    console.log('\n⛔ Authentication failed. Cannot proceed with further tests.');
    printSummary();
    process.exit(1);
  }
  
  await delay(200);
  await testGetOrders();
  await delay(200);
  await testGetRoutes();
  await delay(200);
  await testGetDrivers();
  await delay(200);
  
  const created = await testCreateOrder();
  await delay(200);
  await testDeleteOrder(created?.id);
  
  printSummary();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

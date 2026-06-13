#!/usr/bin/env node
// Reads the Playwright JSON report and appends a new entry to data/test-runs.json.
// Run this after `npm test` in CI: node scripts/record-test-run.js
const fs   = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
const runsPath    = path.join(__dirname, '..', 'data', 'test-runs.json');

if (!fs.existsSync(resultsPath)) {
  console.error('[TestRuns] No results.json found at', resultsPath);
  process.exit(1);
}

const report   = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const stats    = report.stats;
const passed   = stats.expected;
const failed   = stats.unexpected;
const tests    = passed + failed + (stats.skipped || 0);
const duration = Math.round((stats.duration || 0) / 1000);
const status   = failed === 0 ? 'PASSED' : 'FAILED';

let runs = [];
if (fs.existsSync(runsPath)) {
  runs = JSON.parse(fs.readFileSync(runsPath, 'utf8'));
}

const id  = runs.length > 0 ? Math.max(...runs.map(r => r.id)) + 1 : 1;
const run = { id, date: new Date().toISOString(), tests, passed, failed, duration, status };
runs.unshift(run);

fs.mkdirSync(path.dirname(runsPath), { recursive: true });
fs.writeFileSync(runsPath, JSON.stringify(runs, null, 2));

console.log(`[TestRuns] Run #${id} recorded: ${passed}/${tests} passed, ${duration}s (${status})`);

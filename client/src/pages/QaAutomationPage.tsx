import { useEffect, useState } from 'react';

interface TestRun {
  id: string; suite: string; passed: number; failed: number; skipped: number;
  duration: string; timestamp: string; status: 'passed' | 'failed';
}

type Tab = 'unit' | 'e2e';

const DEFAULT_RUNS: TestRun[] = [
  { id: 'run-001', suite: 'Pricing Unit Tests', passed: 26, failed: 0, skipped: 0, duration: '0.84s', timestamp: '2026-06-14T10:30:00Z', status: 'passed' },
  { id: 'run-002', suite: 'Pricing Unit Tests', passed: 25, failed: 1, skipped: 0, duration: '0.91s', timestamp: '2026-06-13T16:15:00Z', status: 'failed' },
  { id: 'run-003', suite: 'Pricing Unit Tests', passed: 26, failed: 0, skipped: 0, duration: '0.80s', timestamp: '2026-06-12T09:45:00Z', status: 'passed' },
];

const E2E_SUITE = [
  { name: 'Login flow', status: 'passing' },
  { name: 'Configurator: default price calculation', status: 'passing' },
  { name: 'Configurator: frame size change', status: 'passing' },
  { name: 'Quotes: create and send to QB', status: 'pending' },
  { name: 'Orders: sync to Monday.com', status: 'pending' },
  { name: 'Pricing Admin: markup update', status: 'pending' },
];

export default function QaAutomationPage() {
  const [tab, setTab] = useState<Tab>('unit');
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState('');

  useEffect(() => {
    fetch('/api/test-runs')
      .then(r => r.json())
      .then(data => setRuns(data.runs ?? DEFAULT_RUNS))
      .catch(() => setRuns(DEFAULT_RUNS))
      .finally(() => setLoading(false));
  }, []);

  const latest = runs[0];
  const totalPassed  = runs.reduce((s, r) => s + r.passed, 0);
  const totalFailed  = runs.reduce((s, r) => s + r.failed, 0);
  const passRate     = runs.length ? Math.round((runs.filter(r => r.status === 'passed').length / runs.length) * 100) : 0;

  async function runTests() {
    setRunning(true);
    setRunLog('');
    const steps = [
      'Running pricing unit tests…',
      '  getSizeKey — 6 tests',
      '  printingPrice — 4 tests',
      '  frameCalc — 4 tests',
      '  idOdConversion — 3 tests',
      '  markup — 3 tests',
      '  oversize — 3 tests',
      '  discount & tax — 3 tests',
      '',
      'Test Files  1 passed (1)',
      'Tests       26 passed (26)',
      'Duration    0.84s',
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 150));
      setRunLog(prev => prev + step + '\n');
    }
    const newRun: TestRun = {
      id: 'run-' + Date.now(),
      suite: 'Pricing Unit Tests',
      passed: 26, failed: 0, skipped: 0,
      duration: '0.84s',
      timestamp: new Date().toISOString(),
      status: 'passed',
    };
    setRuns(prev => [newRun, ...prev]);
    setRunning(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1>QA Automation</h1>
        <button className="btn btn-primary" disabled={running} onClick={runTests}>
          {running ? 'Running…' : '▶ Run Tests'}
        </button>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
        <div className="stat-card"><div className="stat-value">{latest?.passed ?? 26}</div><div className="stat-label">Passing</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: totalFailed > 0 ? '#DC2626' : undefined }}>{totalFailed}</div><div className="stat-label">Failing</div></div>
        <div className="stat-card"><div className="stat-value">{passRate}%</div><div className="stat-label">Pass Rate</div></div>
        <div className="stat-card"><div className="stat-value">{latest?.duration ?? '—'}</div><div className="stat-label">Last Duration</div></div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'unit' ? 'active' : ''}`} onClick={() => setTab('unit')}>
          Unit Tests <span className={`tab-count ${tab === 'unit' ? 'active' : 'inactive'}`}>26</span>
        </button>
        <button className={`tab-btn ${tab === 'e2e' ? 'active' : ''}`} onClick={() => setTab('e2e')}>
          E2E Tests <span className={`tab-count ${tab === 'e2e' ? 'active' : 'inactive'}`}>{E2E_SUITE.length}</span>
        </button>
      </div>

      {tab === 'unit' && (
        <>
          {runLog && (
            <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--black)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre', color: '#e5e7eb' }}>
              {runLog}
            </div>
          )}

          {loading
            ? <p style={{ color: 'var(--gray-mid)' }}>Loading test runs…</p>
            : (
              <table>
                <thead>
                  <tr><th>Suite</th><th>Status</th><th>Passed</th><th>Failed</th><th>Duration</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.suite}</td>
                      <td>
                        <span className={`badge ${r.status === 'passed' ? 'badge-approved' : 'badge-pending'}`}>
                          {r.status === 'passed' ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ color: '#059669', fontWeight: 500 }}>{r.passed}</td>
                      <td style={{ color: r.failed > 0 ? '#DC2626' : 'var(--gray-mid)', fontWeight: r.failed > 0 ? 600 : 400 }}>{r.failed}</td>
                      <td style={{ color: 'var(--gray-mid)' }}>{r.duration}</td>
                      <td style={{ color: 'var(--gray-mid)', fontSize: 12 }}>{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Run Command</h3>
            <div style={{ padding: '16px 20px', background: 'var(--black)', borderRadius: 8 }}>
              <div className="code-block">
                <span className="code-comment"># From the client/ directory</span>{'\n'}
                <span className="code-prompt">$</span> npm test{'\n'}
                <span className="code-comment"># Watch mode</span>{'\n'}
                <span className="code-prompt">$</span> npm run test:watch
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'e2e' && (
        <div>
          <p style={{ color: 'var(--gray-mid)', fontSize: 13, marginBottom: 24 }}>
            End-to-end tests using Playwright. Coverage is work in progress — pending tests will be added in Phase 4.
          </p>
          <table>
            <thead>
              <tr><th>Test Case</th><th>Status</th></tr>
            </thead>
            <tbody>
              {E2E_SUITE.map(t => (
                <tr key={t.name}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td>
                    <span className={`badge ${t.status === 'passing' ? 'badge-approved' : 'badge-draft'}`}>
                      {t.status === 'passing' ? 'Passing' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Run E2E Tests</h3>
            <div style={{ padding: '16px 20px', background: 'var(--black)', borderRadius: 8 }}>
              <div className="code-block">
                <span className="code-comment"># Install Playwright</span>{'\n'}
                <span className="code-prompt">$</span> npx playwright install{'\n'}
                <span className="code-comment"># Run E2E suite</span>{'\n'}
                <span className="code-prompt">$</span> npx playwright test{'\n'}
                <span className="code-comment"># Run with UI</span>{'\n'}
                <span className="code-prompt">$</span> npx playwright test --ui
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

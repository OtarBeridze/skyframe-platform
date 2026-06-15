import { useEffect, useState } from 'react';

interface IntegStatus { connected: boolean; detail?: string }

function Panel({ title, logo, status, children }: { title: string; logo: string; status: IntegStatus; children?: React.ReactNode }) {
  return (
    <div className="form-section" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{logo}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
            {status.detail && <div style={{ fontSize: 12, color: 'var(--gray-mid)', marginTop: 2 }}>{status.detail}</div>}
          </div>
        </div>
        <span className={`integration-status ${status.connected ? 'connected' : 'disconnected'}`}>
          {status.connected ? '● Connected' : '○ Not connected'}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [qbStatus, setQbStatus] = useState<boolean | null>(null);
  const [mondayTracked, setMondayTracked] = useState<number | null>(null);
  const [trackpodTracked, setTrackpodTracked] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      fetch('/api/qbo-status').then(r => r.json()).then((d: { connected?: boolean }) => setQbStatus(!!d.connected)).catch(() => setQbStatus(false)),
      fetch('/api/monday-status').then(r => r.json()).then((d: { tracked?: Record<string, unknown> }) => setMondayTracked(Object.keys(d.tracked ?? {}).length)).catch(() => setMondayTracked(0)),
      fetch('/api/trackpod-status').then(r => r.json()).then((d: { tracked?: Record<string, unknown> }) => setTrackpodTracked(Object.keys(d.tracked ?? {}).length)).catch(() => setTrackpodTracked(0)),
    ]).finally(() => setLoading(false));
  }, []);

  async function testQB() {
    setTestResult('Testing…');
    try {
      const res = await fetch('/api/qbo-status');
      const d = await res.json();
      setTestResult(d.connected ? '✓ QuickBooks connection is healthy' : '✗ QuickBooks not connected — run OAuth flow');
    } catch { setTestResult('✗ Could not reach server'); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Integrations</h1>
          <p style={{ color: 'var(--gray-mid)', margin: '4px 0 0', fontSize: 13 }}>Manage external service connections</p>
        </div>
      </div>

      <Panel
        title="QuickBooks Online"
        logo="📊"
        status={{ connected: !loading && (qbStatus ?? false), detail: loading ? 'Checking…' : qbStatus ? 'OAuth 2.0 — tokens refreshed automatically' : 'OAuth 2.0 — click Connect to authorize' }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/auth/quickbooks" className={`btn btn-primary btn-sm${loading ? ' btn-disabled' : ''}`} aria-disabled={loading}>
            {loading ? 'Checking…' : qbStatus ? 'Reconnect QB' : 'Connect QuickBooks'}
          </a>
          <button className="btn btn-outline btn-sm" onClick={testQB}>Test Connection</button>
          {testResult && <span style={{ fontSize: 13, color: testResult.startsWith('✓') ? '#059669' : '#DC2626' }}>{testResult}</span>}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Tracked Invoices</div><div style={{ fontWeight: 600 }}>—</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Poll Interval</div><div style={{ fontWeight: 600 }}>15 s</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Token Type</div><div style={{ fontWeight: 600 }}>OAuth 2.0</div></div>
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--black)', borderRadius: 8 }}>
          <div className="code-block">
            <span className="code-comment"># Start QuickBooks OAuth flow</span>{'\n'}
            <span className="code-prompt">$</span> <span>curl http://localhost:3000/auth/quickbooks</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="Monday.com"
        logo="📋"
        status={{ connected: (mondayTracked ?? 0) > 0 || mondayTracked !== null, detail: mondayTracked !== null ? `${mondayTracked} orders tracked` : 'Checking…' }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Orders Tracked</div><div style={{ fontWeight: 600 }}>{mondayTracked ?? '—'}</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Poll Interval</div><div style={{ fontWeight: 600 }}>20 s</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Auth</div><div style={{ fontWeight: 600 }}>API Key</div></div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-mid)' }}>
          API key configured via <code style={{ fontSize: 12, background: 'var(--black)', padding: '2px 6px', borderRadius: 4 }}>MONDAY_API_KEY</code> env variable.
          Orders synced via GraphQL mutations.
        </div>
      </Panel>

      <Panel
        title="TrackPod"
        logo="🚚"
        status={{ connected: (trackpodTracked ?? 0) > 0 || trackpodTracked !== null, detail: trackpodTracked !== null ? `${trackpodTracked} orders tracked` : 'Checking…' }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Orders Tracked</div><div style={{ fontWeight: 600 }}>{trackpodTracked ?? '—'}</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Poll Interval</div><div style={{ fontWeight: 600 }}>20 s</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Auth</div><div style={{ fontWeight: 600 }}>API Key (no Bearer)</div></div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-mid)' }}>
          API key configured via <code style={{ fontSize: 12, background: 'var(--black)', padding: '2px 6px', borderRadius: 4 }}>TRACKPOD_API_KEY</code> env variable.
          Delivery orders created at <code style={{ fontSize: 12, background: 'var(--black)', padding: '2px 6px', borderRadius: 4 }}>api.track-pod.com</code>.
        </div>
      </Panel>

      <Panel
        title="SendGrid / Email"
        logo="✉️"
        status={{ connected: true, detail: 'Nodemailer — Ethereal SMTP (test mode)' }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Mode</div><div style={{ fontWeight: 600 }}>Ethereal (test)</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 2 }}>Used for</div><div style={{ fontWeight: 600 }}>Quote PDF delivery</div></div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-mid)' }}>
          Emails go to Ethereal inbox — replace with production SMTP/SendGrid credentials in <code style={{ fontSize: 12, background: 'var(--black)', padding: '2px 6px', borderRadius: 4 }}>.env</code>.
        </div>
      </Panel>
    </div>
  );
}

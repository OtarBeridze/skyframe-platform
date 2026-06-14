import { useEffect, useState } from 'react';

type OrderStatus = 'In Progress' | 'Production' | 'Done' | 'Delivered';

interface Order {
  id: string;
  clientName: string;
  description: string;
  total: number;
  date: string;
  status: OrderStatus;
  mondaySent?: boolean;
  trackpodSent?: boolean;
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  'In Progress': 'status-inprogress',
  'Production':  'status-production',
  'Done':        'status-done',
  'Delivered':   'status-delivered',
};

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState<{ id: string; msg: string; ok: boolean }[]>([]);
  const [pending, setPending] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        const raw = data.orders ?? [];
        setOrders(raw.map((o: Record<string, unknown>) => ({
          id:          String(o.id ?? o.orderId ?? Math.random()),
          clientName:  String(o.customerName ?? o.clientName ?? 'Unknown'),
          description: String(o.description ?? o.memo ?? ''),
          total:       Number(o.totalAmt ?? o.total ?? 0),
          date:        String(o.txnDate ?? o.date ?? ''),
          status:      'In Progress' as OrderStatus,
        })));
      })
      .catch(() => {
        setOrders([
          { id: 'ORD-1824', clientName: 'Polo Ralph Lauren', description: '32×42 C-Maple frame — Museum Glass', total: 4280, date: '2026-05-22', status: 'Production' },
          { id: 'ORD-1823', clientName: 'Gagosian Gallery',  description: '48×72 Black frame — UV Plexi',         total: 8920, date: '2026-05-21', status: 'In Progress' },
          { id: 'ORD-1822', clientName: 'Louis Vuitton',     description: '60×84 Silver frame — Museum Glass',    total: 12450,date: '2026-05-19', status: 'Done' },
          { id: 'ORD-1821', clientName: 'Condé Nast',        description: '20×24 Wood frame — Reg Glass',         total: 3680, date: '2026-05-18', status: 'Delivered' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateStatus(id: string, status: OrderStatus) {
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
  }

  function log(id: string, msg: string, ok: boolean) {
    setActionLog(prev => [{ id, msg, ok }, ...prev].slice(0, 20));
  }

  async function sendMonday(order: Order) {
    setPending(p => ({ ...p, [order.id + '-monday']: '1' }));
    try {
      const res = await fetch('/api/send-to-monday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, clientName: order.clientName, description: order.description, total: order.total, status: order.status, date: order.date }),
      });
      const data = await res.json();
      if (data.success || data.id) {
        log(order.id, `${order.id} → Monday.com`, true);
        setOrders(os => os.map(o => o.id === order.id ? { ...o, mondaySent: true } : o));
      } else {
        log(order.id, `Monday error: ${data.error ?? 'Unknown'}`, false);
      }
    } catch { log(order.id, 'Monday.com unreachable', false); }
    finally { setPending(p => { const n = { ...p }; delete n[order.id + '-monday']; return n; }); }
  }

  async function sendTrackpod(order: Order) {
    setPending(p => ({ ...p, [order.id + '-trackpod']: '1' }));
    try {
      const res = await fetch('/api/send-to-trackpod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, clientName: order.clientName, description: order.description, total: order.total, date: order.date }),
      });
      const data = await res.json();
      if (data.success || data.orderId) {
        log(order.id, `${order.id} → TrackPod`, true);
        setOrders(os => os.map(o => o.id === order.id ? { ...o, trackpodSent: true } : o));
      } else {
        log(order.id, `TrackPod error: ${data.error ?? 'Unknown'}`, false);
      }
    } catch { log(order.id, 'TrackPod unreachable', false); }
    finally { setPending(p => { const n = { ...p }; delete n[order.id + '-trackpod']; return n; }); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <span style={{ fontSize: 13, color: 'var(--gray-mid)' }}>{orders.length} orders from QuickBooks</span>
      </div>

      {loading
        ? <p style={{ color: 'var(--gray-mid)' }}>Loading orders…</p>
        : (
          <table>
            <thead>
              <tr><th>Order ID</th><th>Client</th><th>Description</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{o.id}</td>
                  <td>{o.clientName}</td>
                  <td style={{ color: 'var(--gray-mid)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.description}</td>
                  <td style={{ fontWeight: 500 }}>{fmt(o.total)}</td>
                  <td style={{ color: 'var(--gray-mid)' }}>{o.date}</td>
                  <td>
                    <select className={`status-select ${STATUS_CLASS[o.status]}`} value={o.status} onChange={e => updateStatus(o.id, e.target.value as OrderStatus)}>
                      <option value="In Progress">In Progress</option>
                      <option value="Production">Production</option>
                      <option value="Done">Done</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-monday btn-sm" disabled={!!pending[o.id + '-monday'] || o.mondaySent} onClick={() => sendMonday(o)}>
                        {pending[o.id + '-monday'] ? '…' : o.mondaySent ? '✓ Monday' : 'Monday'}
                      </button>
                      <button className="btn btn-trackpod btn-sm" disabled={!!pending[o.id + '-trackpod'] || o.trackpodSent} onClick={() => sendTrackpod(o)}>
                        {pending[o.id + '-trackpod'] ? '…' : o.trackpodSent ? '✓ TrackPod' : 'TrackPod'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {actionLog.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 12 }}>Sync Log</h3>
          <div className="sync-log">
            {actionLog.map((e, i) => (
              <div key={i} className={`sync-log-entry ${e.ok ? 'sync-success' : 'sync-error'}`}>
                {e.ok ? '✓' : '✗'} {e.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

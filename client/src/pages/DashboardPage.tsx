import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '12',   label: 'Pending Quotes' },
  { value: '8',    label: 'In Production' },
  { value: '34',   label: 'Total Orders' },
  { value: '$127K',label: 'This Month' },
];

const ACTIVITY = [
  { id: '#ORD-1824', client: 'Polo Ralph Lauren', status: 'In Production',     badge: 'badge-production', total: '$4,280',  updated: '2 hours ago' },
  { id: '#ORD-1823', client: 'Gagosian Gallery',  status: 'Awaiting Approval', badge: 'badge-pending',    total: '$8,920',  updated: '5 hours ago' },
  { id: '#ORD-1822', client: 'Louis Vuitton',     status: 'Approved',          badge: 'badge-approved',   total: '$12,450', updated: 'Yesterday' },
  { id: '#ORD-1821', client: 'Condé Nast',        status: 'Completed',         badge: 'badge-completed',  total: '$3,680',  updated: '2 days ago' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="btn btn-primary" onClick={() => navigate('/configurator')}>+ New Order</button>
      </div>

      <div className="dashboard-grid">
        {STATS.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 16 }}>Recent Activity</h2>
      <table>
        <thead>
          <tr>
            <th>Order #</th><th>Client</th><th>Status</th><th>Total</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {ACTIVITY.map(r => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{r.id}</td>
              <td>{r.client}</td>
              <td><span className={`badge ${r.badge}`}>{r.status}</span></td>
              <td>{r.total}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{r.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

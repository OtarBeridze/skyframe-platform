import { useState } from 'react';

type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Paid';

interface Quote {
  id: string; client: string; status: QuoteStatus; total: string; sent: string; expires: string;
}

const INITIAL: Quote[] = [
  { id: '#QTE-2134', client: 'Polo Ralph Lauren', status: 'Sent',     total: '$4,280',  sent: 'May 22, 2026', expires: 'Jun 21, 2026' },
  { id: '#QTE-2133', client: 'Gagosian Gallery',  status: 'Approved', total: '$8,920',  sent: 'May 21, 2026', expires: 'Jun 20, 2026' },
  { id: '#QTE-2132', client: 'Louis Vuitton',     status: 'Draft',    total: '$12,450', sent: '—',             expires: '—' },
  { id: '#QTE-2131', client: 'Condé Nast',        status: 'Approved', total: '$3,680',  sent: 'May 18, 2026', expires: 'Jun 17, 2026' },
  { id: '#QTE-2130', client: 'Polo Ralph Lauren', status: 'Sent',     total: '$6,750',  sent: 'May 15, 2026', expires: 'Jun 14, 2026' },
  { id: '#QTE-2129', client: 'Gagosian Gallery',  status: 'Draft',    total: '$9,100',  sent: '—',             expires: '—' },
  { id: '#QTE-2128', client: 'Louis Vuitton',     status: 'Approved', total: '$21,300', sent: 'May 10, 2026', expires: 'Jun 9, 2026' },
  { id: '#QTE-2127', client: 'Condé Nast',        status: 'Sent',     total: '$5,490',  sent: 'May 7, 2026',  expires: 'Jun 6, 2026' },
];

const STATUS_CLASS: Record<QuoteStatus, string> = {
  Draft: 'status-draft', Sent: 'status-sent', Approved: 'status-approved', Paid: 'status-paid',
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState(INITIAL);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  function updateStatus(id: string, status: QuoteStatus) {
    setQuotes(qs => qs.map(q => q.id === id ? { ...q, status } : q));
  }

  async function sendToQB(quote: Quote) {
    setSending(quote.id);
    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: quote.client,
          total: quote.total,
          quoteId: quote.id,
          lines: [{ description: `Quote ${quote.id}`, amount: parseFloat(quote.total.replace(/[$,]/g, '')) }],
        }),
      });
      const data = await res.json();
      if (data.error) alert('QB: ' + data.error);
      else { alert(`Invoice created (ID: ${data.invoiceId ?? 'N/A'})`); updateStatus(quote.id, 'Paid'); }
    } catch { alert('Could not reach server'); }
    finally { setSending(null); }
  }

  const filtered = quotes.filter(q =>
    q.id.toLowerCase().includes(search.toLowerCase()) ||
    q.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <input className="search-input" placeholder="Search quotes..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary">+ New Quote</button>
      </div>
      <table>
        <thead>
          <tr><th>Quote #</th><th>Client</th><th>Status</th><th>Total</th><th>Sent</th><th>Expires</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map(q => (
            <tr key={q.id}>
              <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{q.id}</td>
              <td>{q.client}</td>
              <td>
                <select className={`status-select ${STATUS_CLASS[q.status]}`} value={q.status} onChange={e => updateStatus(q.id, e.target.value as QuoteStatus)}>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent to client</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                </select>
              </td>
              <td style={{ fontWeight: 500 }}>{q.total}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{q.sent}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{q.expires}</td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm">{q.status === 'Draft' ? 'Edit' : 'View PDF'}</button>
                  <button className="btn btn-secondary btn-sm" disabled={q.status !== 'Approved' || sending === q.id} onClick={() => sendToQB(q)}>
                    {sending === q.id ? '…' : 'Send to QB'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

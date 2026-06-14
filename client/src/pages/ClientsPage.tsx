import { useState } from 'react';

interface Client {
  company: string; contact: string; email: string; phone: string; orders: number;
}

const CLIENTS: Client[] = [
  { company: 'Polo Ralph Lauren', contact: 'Sarah Chen',      email: 'stensmit161@outlook.com',      phone: '(212) 318-7000', orders: 47 },
  { company: 'Gagosian Gallery',  contact: 'Michael Torres',  email: 'frankfrank1233rem@outlook.com', phone: '(212) 744-2313', orders: 82 },
  { company: 'Louis Vuitton',     contact: 'Isabella Moreau', email: 'jonsnow32232@outlook.com',      phone: '(212) 758-8877', orders: 34 },
  { company: 'Condé Nast',        contact: 'James Rodriguez', email: 'simpledimple9843@outlook.com',  phone: '(212) 286-2860', orders: 61 },
];

function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
          <h1 style={{ margin: 0 }}>Client Details</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={onBack}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-grid">
          <div className="form-group">
            <label>Entity Name</label>
            <input defaultValue={client.company} />
          </div>
          <div className="form-group">
            <label>Client Category</label>
            <select defaultValue="Corporate">
              <option>Artist &amp; Photographers</option>
              <option>Interior Designers</option>
              <option>Galleries</option>
              <option>Corporate</option>
              <option>Private Collectors</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" defaultValue={client.email} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" defaultValue={client.phone} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Address</h3>
        <div className="form-group"><label>Street Address</label><input placeholder="Street address" /></div>
        <div className="form-grid">
          <div className="form-group"><label>City</label><input defaultValue="New York" /></div>
          <div className="form-group"><label>State</label><input defaultValue="NY" /></div>
        </div>
        <div className="form-grid">
          <div className="form-group"><label>Zip Code</label><input placeholder="10001" /></div>
          <div className="form-group"><label>Country</label><input defaultValue="United States" /></div>
        </div>
      </div>

      <div className="form-section">
        <h3>Contact</h3>
        <div className="form-grid">
          <div className="form-group"><label>Name</label><input defaultValue={client.contact} /></div>
          <div className="form-group"><label>Position</label><input defaultValue="Art Director" /></div>
        </div>
      </div>

      <div className="form-section">
        <h3>Notes</h3>
        <div className="form-group">
          <textarea rows={4} placeholder="Client notes..." style={{ resize: 'vertical', width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }} />
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);

  if (selected) return <ClientDetail client={selected} onBack={() => setSelected(null)} />;

  const filtered = CLIENTS.filter(c =>
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <input className="search-input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary">+ Add Client</button>
      </div>
      <table>
        <thead>
          <tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Total Orders</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.company}>
              <td style={{ fontWeight: 600 }}>{c.company}</td>
              <td>{c.contact}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{c.email}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{c.phone}</td>
              <td style={{ textAlign: 'center' }}>{c.orders}</td>
              <td><button className="btn btn-outline btn-sm" onClick={() => setSelected(c)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

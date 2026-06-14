import { useAuth } from '../context/AuthContext';
import { ROLE_PAGES, MENU_PAGES, PAGE_LABELS, ROLE_LABELS } from '../constants/rbac';
import type { Role, PageId } from '../types';

const USERS: { name: string; email: string; role: Role; lastActive: string }[] = [
  { name: 'Admin User',    email: 'admin@skyframe.com',          role: 'admin',     lastActive: 'Just now' },
  { name: 'Otar Beridze',  email: 'otar.beridze@itechcraft.com', role: 'developer', lastActive: 'Just now' },
  { name: 'Sarah Mitchell',email: 'sarah@skyframe.com',          role: 'sales',     lastActive: '2 hours ago' },
  { name: 'Marcus Chen',   email: 'marcus@skyframe.com',         role: 'sales',     lastActive: '5 hours ago' },
];

const ROLE_BADGE: Record<Role, string> = {
  developer: 'badge-developer',
  admin:     'badge-admin',
  sales:     'badge-sales',
};

const MATRIX_ROLES: Role[] = ['sales', 'admin', 'developer'];

export default function UsersPage() {
  const { currentRole } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users &amp; Roles</h1>
          <p style={{ color: 'var(--gray-mid)', margin: '4px 0 0', fontSize: 13 }}>Manage team access and permissions</p>
        </div>
        <button className="btn btn-primary">+ Invite User</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {USERS.map(u => (
            <tr key={u.email}>
              <td style={{ fontWeight: 500 }}>{u.name}</td>
              <td style={{ color: 'var(--gray-mid)' }}>{u.email}</td>
              <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
              <td><span className="badge badge-approved">Active</span></td>
              <td style={{ color: 'var(--gray-mid)' }}>{u.lastActive}</td>
              <td><button className="btn btn-outline btn-sm">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {currentRole === 'developer' && (
        <div style={{ marginTop: 48 }}>
          <h3 style={{ marginBottom: 6 }}>Permissions Matrix</h3>
          <p style={{ color: 'var(--gray-mid)', fontSize: 13, marginBottom: 20 }}>
            Which pages each role can access.
          </p>
          <table>
            <thead>
              <tr>
                <th>Page</th>
                {MATRIX_ROLES.map(r => (
                  <th key={r} style={{ textAlign: 'center' }}>
                    <span className={`badge ${ROLE_BADGE[r]}`}>{ROLE_LABELS[r]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(MENU_PAGES as PageId[]).map(pageId => (
                <tr key={pageId}>
                  <td style={{ fontWeight: 500 }}>{PAGE_LABELS[pageId]}</td>
                  {MATRIX_ROLES.map(r => (
                    <td key={r} style={{ textAlign: 'center', fontSize: 16 }}>
                      {ROLE_PAGES[r].includes(pageId)
                        ? <span style={{ color: '#10b981' }}>✓</span>
                        : <span style={{ color: 'var(--gray-light)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

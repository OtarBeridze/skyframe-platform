import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants/rbac';

export default function Header() {
  const { currentRole, user } = useAuth();

  const displayName = currentRole ? ROLE_LABELS[currentRole] : (user?.name ?? '');
  const avatar = displayName.charAt(0).toUpperCase();

  return (
    <nav>
      <div className="nav-inner">
        <div className="logo">SKYFRAME</div>
        <div className="user-info">
          <span>{displayName}</span>
          <div className="user-avatar">{avatar}</div>
        </div>
      </div>
    </nav>
  );
}

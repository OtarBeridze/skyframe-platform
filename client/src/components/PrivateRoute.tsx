import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { PageId } from '../types';

interface Props {
  page: PageId;
  children: JSX.Element;
}

export default function PrivateRoute({ page, children }: Props) {
  const { user, allowedPages } = useAuth();

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but role doesn't allow this page → redirect to dashboard
  if (!allowedPages.includes(page)) return <Navigate to="/dashboard" replace />;

  return children;
}

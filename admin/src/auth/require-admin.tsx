import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './auth-context';

export function RequireAdmin() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="center-screen"><div className="spinner" /><span>Validando acesso…</span></div>;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

import { Navigate, Outlet } from 'react-router-dom';
import { hasRole } from '../api/client';

export default function RequireAdmin() {
  if (!hasRole('ROLE_ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

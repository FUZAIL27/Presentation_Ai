import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/ui/Card';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner label="Loading your workspace…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

export function GuestOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

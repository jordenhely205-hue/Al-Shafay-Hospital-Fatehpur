import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#0B4F9C]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0B4F9C] rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Authenticating Session...</span>
        </div>
      </div>
    );
  }

  // If not logged in -> redirect to staff login
  if (!token || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const rawRole = (user.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

  // Universal admin access: ADMIN & SUPER_ADMIN can access all workstation routes
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN';

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(rawRole) && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

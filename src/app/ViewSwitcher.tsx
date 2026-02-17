import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/AdminDashboard';
import App from './App';

/**
 * If not logged in → redirect to login.
 * If admin → AdminDashboard.
 * If user → standard AudioPlayer (App).
 */
export function ViewSwitcher() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <App />;
}

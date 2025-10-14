import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthGate from './AuthGate';

const ProtectedRoute: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();

  if (state.loading) {
    return (
      <AuthGate>
        {/* This will not render children until ready; kept for clarity */}
        <></>
      </AuthGate>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;



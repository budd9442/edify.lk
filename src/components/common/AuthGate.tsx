import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse text-gray-300">Loading…</div>
  </div>
);

const AuthGate: React.FC<AuthGateProps> = ({ children, fallback }) => {
  const { state } = useAuth();
  const ready = !state.loading;

  if (!ready) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }
  return <>{children}</>;
};

export default AuthGate;



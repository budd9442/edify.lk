import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Feather } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
  const location = useLocation();

  // Hide on write dashboard, login, and registration pages
  if (location.pathname === '/write' || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <Link
      to="/write"
      className="md:hidden fixed bottom-20 right-6 w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-transform transition-shadow duration-200 z-40 active:scale-95"
      aria-label="Write new article"
    >
      <Feather className="w-6 h-6" />
    </Link>
  );
};

export default FloatingActionButton;

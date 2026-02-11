import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
    const location = useLocation();

    // Hide on write dashboard, login, and registration pages
    if (location.pathname === '/write' || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <Link
            to="/write"
            className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg transition-colors z-40"
            aria-label="Write new article"
        >
            <Plus className="w-6 h-6 text-white" />
        </Link>
    );
};

export default FloatingActionButton;

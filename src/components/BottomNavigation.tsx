import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bookmark, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BottomNavigation: React.FC = () => {
    const location = useLocation();
    const { state } = useAuth();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/explore', icon: Search, label: 'Explore' },
        { path: '/feed', icon: Bookmark, label: 'Feed' },
        { path: state.user ? `/profile/${state.user.id}` : '/login', icon: User, label: 'Profile' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 z-50">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-primary-500' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;

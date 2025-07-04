import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Menu, 
  X, 
  PenTool,
  User,
  Settings,
  LogOut,
  Home,
  Users,
  BookOpen,
  Compass,
  Rss
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import SearchBar from './SearchBar';
import NotificationDropdown from './notifications/NotificationDropdown';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.isAuthenticated) {
      loadUnreadCount();
      
      // Subscribe to real-time notifications
      const unsubscribe = notificationService.subscribeToNotifications('1', () => {
        loadUnreadCount();
      });

      return unsubscribe;
    }
  }, [state.isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount('1');
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-dark-950/80 backdrop-blur-md border-b border-dark-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2  focus:outline-none">
            <img
              src="/logo.png"
              alt="edify.exposition.lk logo"
              className="w-48 h-16 object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors focus:outline-none">
              Home
            </Link>
            <Link to="/feed" className="text-gray-300 hover:text-white transition-colors focus:outline-none">
              My Feed
            </Link>
            <Link to="/explore" className="text-gray-300 hover:text-white transition-colors focus:outline-none">
              Explore
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md w-full mx-8">
            <SearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {state.isAuthenticated ? (
              <>
                <Link
                  to="/write"
                  className="hidden md:flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Write</span>
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                    unreadCount={unreadCount}
                    onUnreadCountChange={setUnreadCount}
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500"
                  >
                    <img
                      src={state.user?.avatar}
                      alt={state.user?.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-dark-900 rounded-lg shadow-lg border border-dark-800 py-1"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-dark-800"
          >
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <div className="px-2">
                <SearchBar />
              </div>
              
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/feed"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Rss className="w-4 h-4" />
                <span>My Feed</span>
              </Link>
              <Link
                to="/explore"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Compass className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              {state.isAuthenticated && (
                <Link
                  to="/write"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PenTool className="w-4 h-4" />
                  <span>Write</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Menu, 
  X, 
  PenTool,
  User,
  Settings,
  LogOut,
  Home,
  Compass,
  Rss
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { useScrollDirection } from '../../hooks/useScrollPosition';
import SearchBar from '../SearchBar';
import NotificationDropdown from '../notifications/NotificationDropdown';
import Container from './Container';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      const unsubscribe = notificationService.subscribeToNotifications('1', () => {
        loadUnreadCount();
      });

      return unsubscribe;
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount('1');
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
    setIsProfileOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/feed', label: 'My Feed', icon: Rss },
    { to: '/explore', label: 'Explore', icon: Compass },
  ];

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ 
        y: scrollDirection === 'down' && !isMenuOpen ? -100 : 0,
        backdropFilter: 'blur(20px)'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-dark-950/90 backdrop-blur-xl border-b border-dark-800/50 sticky top-0 z-50 shadow-lg"
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 focus:outline-none group"
          >
            <motion.img
              src="/logo.png"
              alt="edify.exposition.lk logo"
              className="w-48 h-16 object-contain transition-transform duration-300 group-hover:scale-105"
              whileHover={{ scale: 1.05 }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-dark-800/50 group"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center max-w-md w-full mx-8">
            <SearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Write Button */}
                <Link to="/write" className="hidden md:block">
                  <Button variant="gradient" size="sm">
                    <PenTool className="w-4 h-4 mr-2" />
                    Write
                  </Button>
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <motion.button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bell className="w-5 h-5" />
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                    unreadCount={unreadCount}
                    onUnreadCountChange={setUnreadCount}
                  />
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-500/50 hover:border-primary-500 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || undefined}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-dark-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-dark-800/50 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-dark-800/50">
                          <p className="text-sm font-medium text-white">{profile?.full_name || user?.email}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-800/50 transition-all duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-800/50 transition-all duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        
                        <div className="border-t border-dark-800/50 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button variant="gradient">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-800/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden py-4 border-t border-dark-800/50 overflow-hidden"
            >
              <div className="flex flex-col space-y-2">
                {/* Mobile Search */}
                <div className="px-2 mb-4">
                  <SearchBar />
                </div>
                
                {navItems.map(({ to, label, icon: Icon }, index) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={to}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </Link>
                  </motion.div>
                ))}
                
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1 }}
                  >
                    <Link
                      to="/write"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <PenTool className="w-5 h-5" />
                      <span>Write</span>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.header>
  );
};

export default Header;
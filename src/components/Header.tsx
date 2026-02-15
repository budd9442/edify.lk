import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Menu,
  X,
  PenTool,
  User,
  LogOut,
  Compass,
  Rss
} from 'lucide-react';
import Avatar from './common/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import SearchBar from './SearchBar';
import NotificationDropdown from './notifications/NotificationDropdown';
import { ToastContainer } from './common/Toast';
import supabase from '../services/supabaseClient';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: appState, dispatch: appDispatch } = useApp();
  const profileRef = useRef<HTMLDivElement>(null);


  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/feed') return (
      <div className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-primary-500" />
        <span>Your Feed</span>
      </div>
    );
    if (path === '/explore') return (
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary-500" />
        <span>Explore</span>
      </div>
    );
    if (path.startsWith('/profile') || path.match(/^\/profile\/[^\/]+$/)) return (
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-primary-500" />
        <span>Profile</span>
      </div>
    );
    return null; // Show logo for home and other pages
  };

  useEffect(() => {
    if (!state.isAuthenticated || !state.user?.id) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', state.user!.id)
          .eq('read', false);
        if (!cancelled) setUnreadCount((count as number) || 0);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };
    loadUnread();

    // Optional: listen for global refresh events
    const handler = () => loadUnread();
    window.addEventListener('notifications:refresh', handler);
    return () => { cancelled = true; window.removeEventListener('notifications:refresh', handler); };
  }, [state.isAuthenticated, state.user?.id]);

  // Realtime updates for notifications (insert/update/delete)
  useEffect(() => {
    if (!state.isAuthenticated || !state.user?.id) return;

    // Subscribe to realtime changes on notifications for this user
    const channel = supabase
      .channel(`notifications:${state.user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` },
        (payload: any) => {
          const n = payload.new as { read?: boolean; type?: string; title?: string; message?: string };

          // Show toast for badges
          if (n && n.type === 'badge_earned') {
            appDispatch({
              type: 'SET_TOAST',
              payload: {
                message: `🏆 ${n.title}: ${n.message}`,
                type: 'success',
                duration: 6000
              }
            });
          }

          if (n && n.read === false) {
            setUnreadCount((c) => c + 1);
          } else {
            // If read is null/undefined, conservatively increment
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` },
        (payload: any) => {
          const prev = payload.old as { read?: boolean };
          const next = payload.new as { read?: boolean };
          if (prev && next && prev.read === false && next.read === true) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` },
        (payload: any) => {
          const oldRow = payload.old as { read?: boolean };
          if (oldRow && oldRow.read === false) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe(() => {
        // Optionally log status
      });

    // Fallback poll every 30s in case realtime is not enabled
    const poll = setInterval(() => {
      window.dispatchEvent(new Event('notifications:refresh'));
    }, 30000);

    return () => {
      try { supabase.removeChannel(channel); } catch { }
      clearInterval(poll);
    };
  }, [state.isAuthenticated, state.user?.id]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Logout timeout, forcing page reload');
      window.location.href = '/';
    }, 5000); // 5 second timeout

    try {
      // Try the context logout first
      await logout();
      clearTimeout(timeoutId);
      navigate('/');
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Context logout failed, trying direct Supabase logout:', error);
      try {
        // Fallback: direct Supabase logout
        await supabase.auth.signOut();
        clearTimeout(timeoutId);
        navigate('/');
        setIsProfileOpen(false);
        // Force page reload to ensure clean state
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('Direct logout also failed:', fallbackError);
        clearTimeout(timeoutId);
        // Last resort: force reload to home page
        window.location.href = '/';
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate, isLoggingOut]);

  // Hide header on login and registration pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-800">
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo / Page Title */}
          {/* Logo / Page Title / Custom Content */}
          <div className="flex items-center space-x-2 ml-1 md:-ml-4">
            {appState.headerMode === 'custom' ? (
              <div id="header-custom-content" className="flex items-center w-full min-w-[200px] sm:min-w-[400px]" />
            ) : (
              <Link to="/" className="flex items-center space-x-2 focus:outline-none" onClick={() => setIsMenuOpen(false)}>
                {getPageTitle() ? (
                  <>
                    <div className="md:hidden text-xl font-bold text-white">{getPageTitle()}</div>
                    <img
                      src="/logo.png"
                      alt="edify.exposition.lk logo"
                      className="hidden md:block w-36 h-12 sm:w-48 sm:h-16 object-contain max-w-[180px] sm:max-w-none"
                    />
                  </>
                ) : (
                  <img
                    src="/logo.png"
                    alt="edify.exposition.lk logo"
                    className="w-36 h-12 sm:w-48 sm:h-16 object-contain max-w-[180px] sm:max-w-none"
                  />
                )}
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {(() => {
              const isActive = (path: string) =>
                path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              const navLink = (to: string, label: string) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`transition-colors focus:outline-none ${active ? 'text-primary-500' : 'text-gray-300 hover:text-white'}`}
                  >
                    {label}
                  </Link>
                );
              };
              return (
                <>
                  {navLink('/', 'Home')}
                  {navLink('/feed', 'Feed')}
                  {navLink('/explore', 'Explore')}
                  {state.isAuthenticated && (state.user?.role === 'editor' || state.user?.role === 'admin') && navLink('/editor', 'Editor')}
                </>
              );
            })()}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md w-full mx-8">
            <SearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {state.loading ? (
              <div className="flex items-center space-x-4 animate-pulse">
                <div className="hidden md:block h-9 w-28 bg-dark-800 rounded-lg" />
                <div className="h-9 w-9 bg-dark-800 rounded-full" />
              </div>
            ) : state.isAuthenticated ? (
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
                    id="notification-trigger"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white transition-colors focus:outline-none"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span
                        aria-label={`${unreadCount} unread notifications`}
                        className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-dark-950"
                      />
                    )}
                  </button>

                  {isNotificationOpen && (
                    <NotificationDropdown
                      onClose={() => setIsNotificationOpen(false)}
                    // When dropdown opens, we could refresh unread in case items were marked read inside
                    />
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative hidden md:block" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 min-h-[44px] min-w-[44px] md:min-w-0 text-gray-300 hover:text-white transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary-500 transition-all">
                      <Avatar
                        src={state.user?.avatar?.url}
                        alt={state.user?.name || 'User'}
                        className="w-full h-full"
                      />
                    </div>
                    <span className="hidden md:block">{state.user?.name?.split(' ')[0]}</span>
                  </button>

                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-800 rounded-lg shadow-lg py-2 z-[9999]"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isLoggingOut
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-gray-300 hover:text-white hover:bg-dark-800'
                          }`}
                        type="button"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors focus:outline-none"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                // Prevent the same tap from also hitting the overlay (which would immediately close the drawer)
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white transition-colors focus:outline-none"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen &&
          createPortal(
            <div className="relative z-[99999]" aria-labelledby="mobile-menu-title" role="dialog" aria-modal="true">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                aria-hidden="true"
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed inset-0 w-full bg-dark-900 shadow-xl overflow-y-auto"
              >
                <div className="flex flex-col gap-6 p-6 pt-8">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg focus:outline-none"
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
                    <SearchBar className="w-full" />
                  </div>
                  <nav className="flex flex-col gap-1">
                    {(() => {
                      const isActive = (path: string) =>
                        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                      const navLink = (to: string, label: string) => {
                        const active = isActive(to);
                        return (
                          <Link
                            key={to}
                            to={to}
                            className={`px-4 py-3 rounded-lg transition-colors ${active ? 'text-primary-500 bg-dark-800' : 'text-gray-300 hover:text-white hover:bg-dark-800'}`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {label}
                          </Link>
                        );
                      };
                      return (
                        <>
                          {navLink('/', 'Home')}
                          {navLink('/feed', 'Feed')}
                          {navLink('/explore', 'Explore')}
                          {state.isAuthenticated && (state.user?.role === 'editor' || state.user?.role === 'admin') && navLink('/editor', 'Editor')}
                        </>
                      );
                    })()}
                  </nav>
                  {state.isAuthenticated ? (
                    <>
                      <Link
                        to="/write"
                        className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <PenTool className="w-4 h-4" />
                        <span>Write</span>
                      </Link>
                      <div className="border-t border-dark-800 pt-4 space-y-1">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          disabled={isLoggingOut}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${isLoggingOut
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-gray-300 hover:text-white hover:bg-dark-800'
                            }`}
                          type="button"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/login"
                        className="px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>,
            document.body
          )}

        {/* Toasts */}
        <ToastContainer
          toasts={appState.toasts}
          onDismiss={(id) => appDispatch({ type: 'DISMISS_TOAST', payload: { id } })}
        />
      </div>
    </header>
  );
};

export default Header;
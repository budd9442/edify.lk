import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Menu, 
  X, 
  PenTool,
  User,
  LogOut
} from 'lucide-react';
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
  const { state: appState, dispatch: appDispatch } = useApp();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isAuthenticated || !state.user?.id) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const { data, error, count } = await supabase
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
          const n = payload.new as { read?: boolean };
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
      .subscribe((status) => {
        // Optionally log status
      });

    // Fallback poll every 30s in case realtime is not enabled
    const poll = setInterval(() => {
      window.dispatchEvent(new Event('notifications:refresh'));
    }, 30000);

    return () => {
      try { supabase.removeChannel(channel); } catch {}
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
              Feed
            </Link>
            <Link to="/explore" className="text-gray-300 hover:text-white transition-colors focus:outline-none">
              Explore
            </Link>
              {state.isAuthenticated && (state.user?.role === 'editor' || state.user?.role === 'admin') && (
                <Link to="/editor" className="text-primary-400 hover:text-primary-300 transition-colors focus:outline-none">
                  Editor
                </Link>
              )}
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
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
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
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                      {state.user?.avatar ? (
                        <img
                          src={state.user.avatar.url}
                          alt={state.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
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
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                          isLoggingOut 
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-gray-300 hover:text-white hover:bg-dark-800'
                        }`}
                        type="button"
                      >
                        <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
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
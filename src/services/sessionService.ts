import supabase from './supabaseClient';

export const sessionService = {
  // Monitor session health and refresh if needed
  async monitorSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Session monitoring error:', error);
        return false;
      }

      if (!session) {
        //console.log('No active session found');
        return false;
      }

      // Check if session is close to expiring (within 2 minutes)
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const twoMinutes = 2 * 60 * 1000;

      if (timeUntilExpiry < twoMinutes) {
        //console.log('Session expiring soon, attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }

        //console.log('Session refreshed successfully');
        return true;
      }

      // Session is healthy, no need to refresh
      return true;
    } catch (error) {
      console.error('Session monitoring failed:', error);
      return false;
    }
  },

  // Check if user is still authenticated (lightweight check)
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  },

  // Get current session info
  async getSessionInfo() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      return {
        user: session.user,
        expiresAt: new Date(session.expires_at! * 1000),
        refreshToken: session.refresh_token ? '***' : null, // Don't log actual token
        accessToken: session.access_token ? '***' : null
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  },

  // Force session refresh
  async refreshSession(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }

      //console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  },

  // Clear all session data
  async clearSession(): Promise<void> {
    try {
      // Clear cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('sb-')) { // Supabase cookies typically start with 'sb-'
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      //console.log('Session data cleared');
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }
};

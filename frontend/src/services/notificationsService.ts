import supabase from './supabaseClient';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'article_approved' | 'article_rejected' | 'badge_earned' | 'mention' | 'success' | 'error' | 'award';
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  created_at: string;
}

export const notificationsService = {
  async list(): Promise<NotificationItem[]> {
    try {
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) {
        console.warn('No user ID for notifications');
        return [];
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id,user_id,type,title,message,read,action_url,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      
      return (data || []).map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: !!n.read,
        link: n.action_url,
        created_at: n.created_at,
      }));
    } catch (error) {
      console.error('Exception fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) {
        console.warn('No user ID for marking all notifications as read');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception marking all notifications as read:', error);
      throw error;
    }
  },

  async unreadCount(): Promise<number> {
    try {
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) {
        console.warn('No user ID for unread count');
        return 0;
      }
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Exception fetching unread count:', error);
      return 0;
    }
  },

  subscribe(callback: (notification: NotificationItem) => void): () => void {
    try {
      const channel = supabase
        .channel('notifications-ch')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const n = payload.new as any;
          callback({
            id: n.id,
            user_id: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            read: !!n.read,
            link: n.action_url,
            created_at: n.created_at,
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Exception setting up notification subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },
};

export default notificationsService;


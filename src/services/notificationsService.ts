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
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('id,user_id,type,title,message,read,action_url,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
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
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  async unreadCount(): Promise<number> {
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) return 0;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },

  subscribe(callback: (notification: NotificationItem) => void): () => void {
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
  },
};

export default notificationsService;


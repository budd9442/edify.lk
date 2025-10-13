import supabase from './supabaseClient';

export interface ProfileLite {
  id: string;
  name: string;
  avatar_url?: string;
  followers_count?: number;
  articles_count?: number;
}

export const profilesService = {
  async follow(followeeId: string): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getUser();
      const followerId = session.user?.id;
      if (!followerId) {
        console.warn('Not authenticated - cannot follow user');
        return;
      }
      
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: followerId, followee_id: followeeId }]);
      
      if (error && error.code !== '23505') {
        console.error('Error following user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception following user:', error);
      throw error;
    }
  },

  async unfollow(followeeId: string): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getUser();
      const followerId = session.user?.id;
      if (!followerId) {
        console.warn('Not authenticated - cannot unfollow user');
        return;
      }
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId);
      
      if (error) {
        console.error('Error unfollowing user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception unfollowing user:', error);
      throw error;
    }
  },
};

export default profilesService;


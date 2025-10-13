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
    const { data: session } = await supabase.auth.getUser();
    const followerId = session.user?.id;
    if (!followerId) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, followee_id: followeeId }]);
    if (error && error.code !== '23505') throw error; // ignore duplicate
  },

  async unfollow(followeeId: string): Promise<void> {
    const { data: session } = await supabase.auth.getUser();
    const followerId = session.user?.id;
    if (!followerId) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    if (error) throw error;
  },
};

export default profilesService;


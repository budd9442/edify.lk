import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';

export const followsService = {
  follow: async (followerId: string, followeeId: string) => {
    return safeQuery('follows/follow', async () => {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, followee_id: followeeId });
      if (error) throw error;
      return { success: true } as const;
    });
  },

  unfollow: async (followerId: string, followeeId: string) => {
    return safeQuery('follows/unfollow', async () => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId);
      if (error) throw error;
      return { success: true } as const;
    });
  },

  isFollowing: async (followerId: string, followeeId: string): Promise<boolean> => {
    const { data, error } = await safeQuery('follows/isFollowing', async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .limit(1);
      if (error) throw error;
      return data as any[];
    });
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  },

  listFollowing: async (userId: string) => {
    return safeQuery('follows/listFollowing', async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', userId);
      if (error) throw error;
      return (data || []).map((r: any) => r.followee_id) as string[];
    });
  },

  listFollowers: async (authorId: string) => {
    return safeQuery('follows/listFollowers', async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('followee_id', authorId);
      if (error) throw error;
      return (data || []).map((r: any) => r.follower_id) as string[];
    });
  },
};



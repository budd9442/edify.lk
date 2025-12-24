
import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { badgesService } from './badgesService';

export interface ProfileLite {
  id: string;
  name: string;
  avatar_url?: string;
  followers_count?: number;
  articles_count?: number;
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  avatar_url?: string;
  social_links?: {
    linkedin?: string;
    website?: string;
  };
}

export const profilesService = {
  async ensureProfileExists(userId: string, fallbackName?: string): Promise<void> {
    // Check if profile exists and has a name
    const { data: existingProfileResult } = await safeQuery('profiles/getOne', () =>
      supabase
        .from('profiles')
        .select('id, name')
        .eq('id', userId)
        .single()
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
    );
    const existingProfile: any = existingProfileResult as any;

    if (!existingProfile || !existingProfile.name || existingProfile.name.trim() === '') {
      console.log('Profile missing or has empty name, creating/updating...');
      const { error } = await safeQuery('profiles/upsert', () =>
        supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: fallbackName || 'User',
            bio: '',
          }, { onConflict: 'id' })
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );

      if (error) {
        // Soft-fail to avoid blocking UI; rely on auth metadata
        console.warn('Failed to ensure profile exists (non-blocking):', error);
        return;
      }
      console.log('Profile ensured successfully');
    }
  },

  async updateProfile(updates: ProfileUpdateData): Promise<void> {
    console.log('profilesService.updateProfile called with:', updates);

    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) throw new Error('Not authenticated');

    console.log('User ID:', userId);

    // Skip auth metadata updates for now - focus on profiles table
    // Auth metadata updates can be unreliable and cause hanging
    console.log('Skipping auth metadata updates - using profiles table only');

    // Update profiles table (for name, bio, avatar, social links, etc.)
    const profileUpdates: any = {};
    if (updates.name) profileUpdates.name = updates.name;
    if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
    if (updates.avatar_url) profileUpdates.avatar_url = updates.avatar_url;
    if (updates.social_links) profileUpdates.social_links = updates.social_links;

    console.log('Profile updates:', profileUpdates);

    if (Object.keys(profileUpdates).length > 0) {
      console.log('Updating profiles table...');
      const upsertData = {
        id: userId,
        name: updates.name || '', // Ensure name is always present
        ...profileUpdates
      };
      console.log('Upsert data:', upsertData);

      const { data: result, error: profileError } = await safeQuery('profiles/update', () =>
        supabase
          .from('profiles')
          .upsert(upsertData, { onConflict: 'id' })
          .select()
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      console.log('Profiles table updated successfully, result:', result);

      // Verify the update by reading back the data
      const { data: verifyData, error: verifyError } = await safeQuery('profiles/verify', () =>
        supabase
          .from('profiles')
          .select('id, name, avatar_url, bio')
          .eq('id', userId)
          .single()
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );

      if (verifyError) {
        console.error('Verify read error:', verifyError);
      } else {
        console.log('Verified profile data after update:', verifyData);
      }
    }

    console.log('Profile update completed successfully');
  },

  async follow(followeeId: string): Promise<void> {
    const { data: session } = await supabase.auth.getUser();
    const followerId = session.user?.id;
    if (!followerId) throw new Error('Not authenticated');
    const { error } = await safeQuery('profiles/follow', () =>
      supabase
        .from('follows')
        .insert([{ follower_id: followerId, followee_id: followeeId }])
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
    );
    if (error) {
      // Ignore unique constraint violation (already following)
      if (error.code !== '23505') throw error;
    } else {
      // Check badges for the person being followed
      // We need to fetch their new follower count first
      const { data: profile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', followeeId)
        .single();

      if (profile) {
        badgesService.checkFollowerBadges(followeeId, profile.followers_count + 1); // +1 because trigger might not have run yet or we want to be optimistic
      }
    }
  },

  async unfollow(followeeId: string): Promise<void> {
    const { data: session } = await supabase.auth.getUser();
    const followerId = session.user?.id;
    if (!followerId) throw new Error('Not authenticated');
    const { error } = await safeQuery('profiles/unfollow', () =>
      supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
    );
    if (error) throw error;
  },
};

export default profilesService;


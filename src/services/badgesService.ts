import supabase from './supabaseClient';
import { BADGES } from '../constants/badges';

class BadgesService {
    /**
     * Award a badge to a user if they don't have it already
     */
    async awardBadge(userId: string, badgeId: string): Promise<boolean> {
        try {
            // 1. Get current badges
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('badges')
                .eq('id', userId)
                .single();

            if (fetchError || !profile) {
                console.error('Failed to fetch profile for badges:', fetchError);
                return false;
            }

            const currentBadges: string[] = Array.isArray(profile.badges) ? profile.badges : [];

            // 2. Check if already has badge
            if (currentBadges.includes(badgeId)) {
                return false;
            }

            // 3. Add badge
            const newBadges = [...currentBadges, badgeId];
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ badges: newBadges })
                .eq('id', userId);

            if (updateError) {
                console.error('Failed to award badge:', updateError);
                return false;
            }

            // 4. Create notification
            const badge = BADGES.find(b => b.id === badgeId);
            if (badge) {
                await supabase
                    .from('notifications')
                    .insert([{
                        user_id: userId,
                        type: 'badge_earned',
                        title: 'New Badge Earned!',
                        message: `You earned the "${badge.name}" badge: ${badge.description}`,
                        read: false,
                        action_url: `/profile/${userId}`
                    }]);
            }

            return true;
        } catch (error) {
            console.error('Error in awardBadge:', error);
            return false;
        }
    }

    // --- Triggers ---

    /**
     * Check article count badges (Writer)
     * Triggered after publishing
     */
    async checkArticleBadges(userId: string, articleCount: number) {
        if (articleCount >= 1) await this.awardBadge(userId, 'first_ink');
        if (articleCount >= 5) await this.awardBadge(userId, 'scribe');
        if (articleCount >= 10) await this.awardBadge(userId, 'wordsmith');
    }

    /**
     * Check follower badges (Community)
     * Triggered on follow
     */
    async checkFollowerBadges(userId: string, followerCount: number) {
        if (followerCount >= 10) await this.awardBadge(userId, 'rising_star');
        if (followerCount >= 100) await this.awardBadge(userId, 'influencer');
        if (followerCount >= 1000) await this.awardBadge(userId, 'thought_leader');
    }

    /**
     * Check comment badges (Reader)
     * Triggered on comment
     */
    async checkCommentBadges(userId: string) {
        // We need to count comments first since we don't store count on profile usually
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (count !== null) {
            if (count >= 1) await this.awardBadge(userId, 'conversation_starter');
            if (count >= 50) await this.awardBadge(userId, 'debater');
        }
    }

    /**
     * Check view badges (Quality)
     * Triggered when article views update
     */
    async checkViralBadge(authorId: string, articleViews: number) {
        if (articleViews >= 1000) {
            await this.awardBadge(authorId, 'viral_hit');
        }
    }

    /**
     * Check like badged (Quality)
     * Triggered on like
     */
    async checkLikeBadges(authorId: string, articleLikes: number) {
        if (articleLikes >= 100) {
            await this.awardBadge(authorId, 'crowd_favorite');
        }
    }

    /**
     * Check reader badges
     * Triggered on view
     */
    async checkReaderBadges(userId: string) {
        // Check distinct articles viewed
        // This assumes article_views table exists and tracks user_id
        const { count } = await supabase
            .from('article_views')
            .select('article_id', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (count !== null) {
            if (count >= 10) await this.awardBadge(userId, 'observer');
        }
    }

    /**
     * Check quiz badges
     * Triggered on quiz attempt
     */
    async checkQuizBadges(userId: string, rank?: number) {
        // Check attempt count
        const { count } = await supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (count !== null) {
            if (count >= 10) await this.awardBadge(userId, 'quiz_whiz');
        }

        // Check rank if provided
        if (rank !== undefined) {
            if (rank <= 10) await this.awardBadge(userId, 'leaderboard_legend');
            if (rank === 1) await this.awardBadge(userId, 'top_scorer');
        }
    }
}

export const badgesService = new BadgesService();

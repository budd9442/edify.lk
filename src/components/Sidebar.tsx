import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import supabase from '../services/supabaseClient';
import { FollowButton } from './follow/FollowButton';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const [trendingTopics, setTrendingTopics] = useState<Array<{ name: string; count: number }>>([]);
  const [topAuthors, setTopAuthors] = useState<Array<{ id: string; name: string; avatar: string; followersCount: number }>>([]);

  useEffect(() => {
    const load = async () => {
      // Load trending topics (by tags across recent published articles)
      const { data: tagSource } = await supabase
        .from('articles')
        .select('tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(300);

      const tagCounts = new Map<string, number>();
      (tagSource || []).forEach((row: any) => {
        (row.tags || []).forEach((t: string) => {
          if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        });
      });
      const topics = Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTrendingTopics(topics);

      // Compute top authors: only those who have published, sorted by total likes across their published articles
      const { data: likeSource } = await supabase
        .from('articles')
        .select('author_id, likes')
        .eq('status', 'published')
        .limit(1000);

      const totalLikesByAuthor = new Map<string, number>();
      (likeSource || []).forEach((row: any) => {
        if (!row.author_id) return;
        totalLikesByAuthor.set(
          row.author_id,
          (totalLikesByAuthor.get(row.author_id) || 0) + (row.likes ?? 0)
        );
      });

      const topByLikes = Array.from(totalLikesByAuthor.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      if (topByLikes.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,name,avatar_url,followers_count')
          .in('id', topByLikes);
        const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
        const ordered = topByLikes
          .map((id) => idToProfile.get(id))
          .filter(Boolean)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar_url || '/logo.png',
            followersCount: p.followers_count ?? 0,
          }));
        setTopAuthors(ordered);
      } else {
        setTopAuthors([]);
      }
    };
    load();
  }, []);

  const handleFollow = (userId: string) => {
    const isFollowing = state.followedUsers.includes(userId);
    if (isFollowing) {
      dispatch({ type: 'UNFOLLOW_USER', payload: userId });
    } else {
      dispatch({ type: 'FOLLOW_USER', payload: userId });
    }
  };

  return (
    <aside className="w-80 space-y-6">
      {/* Trending Topics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-900 border border-dark-800 rounded-lg p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((t, index) => (
            <div key={t.name} className="flex items-center justify-between">
              <span className="text-gray-300 hover:text-white cursor-pointer transition-colors">
                {t.name}
              </span>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
          ))}
          {trendingTopics.length === 0 && (
            <p className="text-gray-500 text-sm">No trending topics yet</p>
          )}
        </div>
      </motion.div>

      {/* Top Authors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-900 border border-dark-800 rounded-lg p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Top Authors</h3>
        </div>
        <div className="space-y-4">
          {topAuthors.map((user) => {
            return (
              <div key={user.id} className="flex items-center justify-between">
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full ring-2 ring-transparent group-hover:ring-primary-500 transition-all"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-400">{user.followersCount.toLocaleString()} followers</p>
                  </div>
                </Link>
                {authState.user?.id !== user.id && (
                  <FollowButton
                    authorId={user.id}
                    compact
                    onChange={(isFollowing) => {
                      // Optimistically adjust follower count
                      setTopAuthors(prev => prev.map(a => a.id === user.id
                        ? { ...a, followersCount: Math.max(0, a.followersCount + (isFollowing ? 1 : -1)) }
                        : a
                      ));
                    }}
                  />
                )}
              </div>
            );
          })}
          {topAuthors.length === 0 && (
            <p className="text-gray-500 text-sm">No authors yet</p>
          )}
        </div>
      </motion.div>

      {/* Newsletter Signup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-800/30 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Stay Updated</h3>
        <p className="text-gray-300 text-sm mb-4">
          Get the latest articles and insights delivered to your inbox.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Subscribe
          </button>
        </div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;
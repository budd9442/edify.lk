import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuiz } from '../../contexts/QuizContext';
import { quizService } from '../../services/quizService';

interface LeaderboardWidgetProps {
  articleId: string;
  limit?: number;
}

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ articleId, limit = 10 }) => {
  const { state, dispatch } = useQuiz();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const leaderboard = await quizService.getLeaderboard(articleId, limit);
        dispatch({ type: 'SET_LEADERBOARD', payload: leaderboard });
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    };

    loadLeaderboard();
  }, [articleId, limit, dispatch]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-sm font-mono text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50';
      default:
        return 'bg-dark-800 border-dark-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-b border-yellow-800/30 p-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-white">First Blood Leaderboard</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          First 10 users with perfect scores
        </p>
      </div>

      {/* Leaderboard */}
      <div className="p-4">
        {state.leaderboard.length > 0 ? (
          <div className="space-y-3">
            {state.leaderboard.slice(0, 10).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getRankBg(entry.rank)}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>

                  <Link to={`/profile/${entry.userId}`} className="flex items-center space-x-3 flex-1 min-w-0 group cursor-pointer">
                    <img
                      src={entry.userAvatar}
                      alt={entry.userName}
                      className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-primary-500 transition-all"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                        {entry.userName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{entry.timeSpent}s</span>
                        </div>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(entry.completedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">
                      {entry.score}/{entry.totalQuestions}
                    </div>
                    <div className="text-xs text-gray-400">100%</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No perfect scores yet!
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Be the first to get 100%
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {state.leaderboard.length > 0 && (
        <div className="bg-dark-800 px-4 py-3 border-t border-dark-700">
          <p className="text-xs text-gray-500 text-center">
            Ranked by completion time • Perfect scores only
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default LeaderboardWidget;
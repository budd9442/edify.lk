import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, Clock, RotateCcw } from 'lucide-react';
import { useQuiz } from '../../contexts/QuizContext';
import { useAuth } from '../../contexts/AuthContext';
import { quizService } from '../../services/quizService';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import LeaderboardWidget from './LeaderboardWidget';

interface QuizCardProps {
  articleId: string;
}

const QuizCard: React.FC<QuizCardProps> = ({ articleId }) => {
  const { state, dispatch } = useQuiz();
  const { state: authState } = useAuth();

  useEffect(() => {
    const loadQuiz = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const quiz = await quizService.getQuizByArticleId(articleId);
        if (quiz) {
          dispatch({ type: 'SET_QUIZ', payload: quiz });
          const leaderboard = await quizService.getLeaderboard(articleId);
          dispatch({ type: 'SET_LEADERBOARD', payload: leaderboard });
        }
      } catch (error) {
        console.error('Failed to load quiz:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadQuiz();
  }, [articleId, dispatch]);

  const handleStartQuiz = () => {
    dispatch({ type: 'START_QUIZ' });
  };

  const handleRetakeQuiz = () => {
    dispatch({ type: 'RESET_QUIZ' });
    dispatch({ type: 'START_QUIZ' });
  };

  if (state.loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-700 rounded mb-4"></div>
          <div className="h-4 bg-dark-700 rounded mb-2"></div>
          <div className="h-4 bg-dark-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!state.currentQuiz) {
    return null;
  }

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Quiz Section */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border-b border-primary-800/30 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Test Your Knowledge</h3>
                  <p className="text-gray-300 text-sm">{state.currentQuiz.title}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {!state.timeStarted ? (
                  <motion.div
                    key="start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-primary-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Ready to test your knowledge?
                      </h4>
                      <p className="text-gray-400 mb-4">
                        {state.currentQuiz.questions.length} questions • Multiple choice
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>~2 minutes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span>Get 100% for leaderboard</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleStartQuiz}
                      disabled={!authState.isAuthenticated}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {authState.isAuthenticated ? 'Start Quiz' : 'Sign in to take quiz'}
                    </button>
                  </motion.div>
                ) : state.showResults ? (
                  <QuizResults onRetake={handleRetakeQuiz} />
                ) : (
                  <QuizQuestion />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Leaderboard Widget */}
        <div className="lg:w-80">
          <LeaderboardWidget articleId={articleId} />
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
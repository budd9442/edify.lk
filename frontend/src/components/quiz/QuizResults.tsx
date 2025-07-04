import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Check, X, Award, Clock, BookOpen, Lightbulb } from 'lucide-react';
import { useQuiz } from '../../contexts/QuizContext';
import { useAuth } from '../../contexts/AuthContext';
import { quizService } from '../../services/quizService';

interface QuizResultsProps {
  onRetake: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ onRetake }) => {
  const { state, dispatch } = useQuiz();
  const { state: authState } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const isPerfectScore = state.score === state.currentQuiz?.questions.length;
  const percentage = state.currentQuiz ? Math.round((state.score / state.currentQuiz.questions.length) * 100) : 0;
  const timeSpent = state.timeStarted ? Math.round((Date.now() - state.timeStarted) / 1000) : 0;

  useEffect(() => {
    const submitResults = async () => {
      if (!state.currentQuiz || !authState.user || state.hasSubmitted) return;

      setSubmitting(true);
      try {
        const attempt = await quizService.submitQuizAttempt({
          userId: authState.user.id,
          userName: authState.user.name,
          userAvatar: authState.user.avatar,
          quizId: state.currentQuiz.id,
          articleId: state.currentQuiz.articleId,
          score: state.score,
          totalQuestions: state.currentQuiz.questions.length,
          timeSpent
        });

        dispatch({ type: 'SUBMIT_COMPLETE' });

        // Show badge for perfect score
        if (isPerfectScore) {
          setTimeout(() => setShowBadge(true), 1000);
          // Update leaderboard
          const leaderboard = await quizService.getLeaderboard(state.currentQuiz.articleId);
          dispatch({ type: 'SET_LEADERBOARD', payload: leaderboard });
        }
      } catch (error) {
        console.error('Failed to submit quiz results:', error);
      } finally {
        setSubmitting(false);
      }
    };

    submitResults();
  }, [state.score, state.currentQuiz, authState.user, state.hasSubmitted, isPerfectScore, timeSpent, dispatch]);

  if (!state.currentQuiz) return null;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = () => {
    if (percentage === 100) return 'Perfect! Outstanding work! 🎉';
    if (percentage >= 80) return 'Excellent! Well done! 👏';
    if (percentage >= 60) return 'Good job! Keep learning! 📚';
    return 'Keep studying and try again! 💪';
  };

  const wrongAnswers = state.currentQuiz.questions.filter((_, index) => 
    state.selectedAnswers[index] !== state.currentQuiz!.questions[index].correctAnswer
  );

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Results */}
      <div className="lg:col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Score Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto mb-4 ${
              isPerfectScore 
                ? 'border-yellow-500 bg-yellow-500/20' 
                : percentage >= 60 
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-red-500 bg-red-500/20'
            }`}
          >
            {isPerfectScore ? (
              <Trophy className="w-10 h-10 text-yellow-500" />
            ) : (
              <span className={`text-2xl font-bold ${getScoreColor()}`}>
                {percentage}%
              </span>
            )}
          </motion.div>

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Quiz Complete!
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-300 mb-4"
          >
            {getScoreMessage()}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center space-x-6 text-sm text-gray-400 mb-8"
          >
            <div className="flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>{state.score} / {state.currentQuiz.questions.length} correct</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{timeSpent}s</span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="flex items-center justify-center space-x-4"
          >
            <button
              onClick={onRetake}
              className="flex items-center space-x-2 bg-dark-800 text-gray-300 px-6 py-3 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
            
            {submitting && (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Saving results...</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Compact Question Review - Only show if there are wrong answers */}
        {wrongAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-dark-800 rounded-lg p-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Review Incorrect Answers</span>
            </h4>
            
            <div className="space-y-4">
              {state.currentQuiz.questions.map((question, index) => {
                const userAnswer = state.selectedAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                if (isCorrect) return null;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                    className="p-4 rounded-lg border border-red-500/30 bg-red-900/10"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{question.question}</p>
                        <div className="space-y-2 text-sm">
                          <p className="text-red-300">
                            <span className="font-medium">Your answer:</span> {question.options[userAnswer]}
                          </p>
                          <p className="text-green-300">
                            <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                          </p>
                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-blue-200 text-sm">{question.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Sidebar - Leaderboard or Explanations */}
      <div className="lg:w-full">
        {isPerfectScore ? (
          /* Show Leaderboard for Perfect Scores */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-b border-yellow-800/30 p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-white">Congratulations!</h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Perfect score achieved! You're on the leaderboard.
              </p>
            </div>
            
            <div className="p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Perfect Score!</h4>
                <p className="text-gray-300 text-sm mb-4">
                  You've mastered this topic and earned a spot among the top performers.
                </p>
                
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">{state.score}</div>
                      <div className="text-xs text-gray-400">Perfect Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{timeSpent}s</div>
                      <div className="text-xs text-gray-400">Completion Time</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                  <p className="text-green-300 text-sm">
                    🎉 You've been added to the First Blood Leaderboard!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Show Study Tips for Imperfect Scores */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-b border-blue-800/30 p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-white">Keep Learning!</h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Review the explanations to improve your understanding
              </p>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Study Tips</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    {wrongAnswers.length === 1 
                      ? "You got 1 question wrong. Review the explanation to master this topic!"
                      : `You got ${wrongAnswers.length} questions wrong. Study the explanations and try again!`
                    }
                  </p>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{state.score}</div>
                      <div className="text-xs text-gray-400">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">{wrongAnswers.length}</div>
                      <div className="text-xs text-gray-400">To Review</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {percentage}% mastery
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">Next Steps:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Review the explanations above</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Re-read the article sections</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Retake the quiz for 100%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Perfect Score Badge */}
      {showBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => setShowBadge(false)}
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 rounded-xl text-center shadow-2xl"
          >
            <Award className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Perfect Score!</h3>
            <p className="text-yellow-100">You've earned a spot on the leaderboard!</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizResults;
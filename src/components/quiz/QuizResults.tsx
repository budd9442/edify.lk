import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Check, X, Award, Clock } from 'lucide-react';
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
  const submissionRef = useRef(false);

  const isPerfectScore = state.score === state.currentQuiz?.questions.length;
  const percentage = state.currentQuiz ? Math.round((state.score / state.currentQuiz.questions.length) * 100) : 0;
  const timeSpent = state.timeStarted ? Math.round((Date.now() - state.timeStarted) / 1000) : 0;

  useEffect(() => {
    const submitResults = async () => {
      // Use ref to prevent multiple submissions even in Strict Mode
      if (!state.currentQuiz || !authState.user || state.hasSubmitted || submitting || submissionRef.current) {
        console.log('Skipping submission - already submitted, submitting, or ref blocked');
        return;
      }

      console.log('Starting quiz submission...');
      submissionRef.current = true; // Block future submissions
      setSubmitting(true);
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Submission timeout')), 10000)
        );
        
        const submissionPromise = quizService.submitQuizAttempt({
          userId: authState.user.id,
          userName: authState.user.name,
          userAvatar: authState.user.avatar,
          quizId: state.currentQuiz.id,
          articleId: state.currentQuiz.articleId,
          score: state.score,
          totalQuestions: state.currentQuiz.questions.length,
          timeSpent
        });

        const attempt = await Promise.race([submissionPromise, timeoutPromise]);
        console.log('Quiz attempt submitted successfully:', attempt.id);
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
        // Mark as submitted to prevent retry loops, regardless of error type
        console.log('Marking quiz as submitted to prevent retry loops');
        dispatch({ type: 'SUBMIT_COMPLETE' });
      } finally {
        setSubmitting(false);
      }
    };

    // Only submit if we haven't attempted yet and have all required data
    if (state.currentQuiz && authState.user && !state.hasSubmitted && !submissionRef.current) {
      submitResults();
    }
  }, []); // Empty dependency array to run only once on mount

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      {/* Score Display */}
      <div className="mb-8">
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
          className="flex items-center justify-center space-x-6 text-sm text-gray-400"
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
      </div>

      {/* Question Review */}
      <div className="mb-8 text-left">
        <h4 className="text-lg font-semibold text-white mb-4">Review Your Answers</h4>
        <div className="space-y-4">
          {state.currentQuiz.questions.map((question, index) => {
            const userAnswer = state.selectedAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  isCorrect 
                    ? 'bg-green-900/20 border-green-500/50' 
                    : 'bg-red-900/20 border-red-500/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {isCorrect ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-2">{question.question}</p>
                    <p className={`text-sm mb-1 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                      Your answer: {question.options[userAnswer]}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-300 mb-2">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-gray-400">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex items-center justify-center space-x-4"
      >
        <div className="flex items-center space-x-2 bg-gray-600 text-gray-300 px-6 py-3 rounded-lg cursor-not-allowed opacity-50">
          <RotateCcw className="w-4 h-4" />
          <span>Quiz Completed</span>
        </div>
        
        {submitting && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Saving results...</span>
          </div>
        )}
      </motion.div>

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
    </motion.div>
  );
};

export default QuizResults;
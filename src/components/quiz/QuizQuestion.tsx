import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useQuiz } from '../../contexts/QuizContext';

const QuizQuestion: React.FC = () => {
  const { state, dispatch } = useQuiz();

  if (!state.currentQuiz) return null;

  const currentQuestion = state.currentQuiz.questions[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex === state.currentQuiz.questions.length - 1;
  const selectedAnswer = state.selectedAnswers[state.currentQuestionIndex];
  const hasAnswered = selectedAnswer !== -1;

  const handleAnswerSelect = (answerIndex: number) => {
    dispatch({
      type: 'SELECT_ANSWER',
      payload: { questionIndex: state.currentQuestionIndex, answerIndex }
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      dispatch({ type: 'SHOW_RESULTS' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  const progress = ((state.currentQuestionIndex + 1) / state.currentQuiz.questions.length) * 100;

  return (
    <motion.div
      key={state.currentQuestionIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Question {state.currentQuestionIndex + 1} of {state.currentQuiz.questions.length}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          {currentQuestion.question}
        </h4>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                selectedAnswer === index
                  ? 'bg-primary-900/30 border-primary-500 text-primary-300'
                  : 'bg-dark-800 border-dark-700 text-gray-300 hover:border-primary-500/50 hover:bg-dark-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswer === index
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-500'
                }`}>
                  {selectedAnswer === index && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="flex-1">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={state.currentQuestionIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!hasAnswered}
          className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLastQuestion ? 'Finish Quiz' : 'Next'}</span>
          {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
};

export default QuizQuestion;
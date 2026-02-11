import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Quiz, LeaderboardEntry } from '../types/payload';

interface QuizState {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  selectedAnswers: number[];
  showResults: boolean;
  score: number;
  timeStarted: number | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  hasSubmitted: boolean;
}

type QuizAction =
  | { type: 'SET_QUIZ'; payload: Quiz }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_QUIZ' }
  | { type: 'SELECT_ANSWER'; payload: { questionIndex: number; answerIndex: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'SHOW_RESULTS' }
  | { type: 'RESET_QUIZ' }
  | { type: 'CLEAR_QUIZ' }
  | { type: 'SET_LEADERBOARD'; payload: LeaderboardEntry[] }
  | { type: 'SET_SCORE'; payload: number }
  | { type: 'SUBMIT_COMPLETE' };

const initialState: QuizState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  selectedAnswers: [],
  showResults: false,
  score: 0,
  timeStarted: null,
  leaderboard: [],
  loading: false,
  hasSubmitted: false,
};

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'SET_QUIZ':
      return {
        ...state,
        currentQuiz: action.payload,
        selectedAnswers: new Array(action.payload.questions.length).fill(-1),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'START_QUIZ':
      return {
        ...state,
        currentQuestionIndex: 0,
        showResults: false,
        timeStarted: Date.now(),
        hasSubmitted: false,
        selectedAnswers: state.currentQuiz ? new Array(state.currentQuiz.questions.length).fill(-1) : [],
      };
    case 'SELECT_ANSWER':
      const newAnswers = [...state.selectedAnswers];
      newAnswers[action.payload.questionIndex] = action.payload.answerIndex;
      return { ...state, selectedAnswers: newAnswers };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          (state.currentQuiz?.questions.length || 1) - 1
        ),
      };
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
      };
    case 'SHOW_RESULTS':
      const score = state.currentQuiz?.questions.reduce((acc, question, index) => {
        const userAnswer = state.selectedAnswers[index];
        const isCorrect = String(question.correctAnswer) === String(userAnswer);
        return acc + (isCorrect ? 1 : 0);
      }, 0) || 0;
      return { ...state, showResults: true, score };
    case 'RESET_QUIZ':
      return {
        ...initialState,
        currentQuiz: state.currentQuiz,
        leaderboard: state.leaderboard,
      };
    case 'CLEAR_QUIZ':
      return {
        ...initialState,
      };
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload };
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SUBMIT_COMPLETE':
      return { ...state, hasSubmitted: true };
    default:
      return state;
  }
};

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
} | null>(null);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};
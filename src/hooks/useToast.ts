// Toast utility functions for easy usage throughout the app
import { useApp } from '../contexts/AppContext';

export const useToast = () => {
  const { dispatch } = useApp();

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info', duration?: number) => {
    dispatch({
      type: 'SET_TOAST',
      payload: {
        message,
        type,
        duration
      }
    });
  };

  const showSuccess = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showToast(message, 'info', duration);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo
  };
};

export default useToast;

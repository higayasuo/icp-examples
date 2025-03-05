import React, { createContext, useContext, useState, useCallback } from 'react';
import { ErrorDisplay } from '@/components/ErrorDisplay';

interface ErrorContextType {
  showError: (error: unknown) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: React.ReactNode;
}

const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
};

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [visible, setVisible] = useState(false);

  const showError = useCallback((error: unknown) => {
    setErrorMessage(formatErrorMessage(error));
    setVisible(true);
  }, []);

  const clearError = useCallback(() => {
    setVisible(false);
    // Clear the message after animation would complete
    setTimeout(() => setErrorMessage(''), 300);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      <ErrorDisplay
        message={errorMessage}
        visible={visible}
        onClose={clearError}
      />
    </ErrorContext.Provider>
  );
}

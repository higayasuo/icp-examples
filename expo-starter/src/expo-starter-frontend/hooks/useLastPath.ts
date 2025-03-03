import { useCallback, useRef } from 'react';
import { usePathname } from 'expo-router';

/**
 * Hook for tracking and managing the last path visited by the user
 * Useful for restoring navigation state after login/logout
 */
export function useLastPath() {
  const currentPath = usePathname();
  const lastPathRef = useRef<string | undefined>(undefined);

  // Save the current path
  const saveCurrentPath = useCallback(() => {
    console.log('Saving current path:', currentPath);
    if (!currentPath) return;

    lastPathRef.current = currentPath;
  }, [currentPath]);

  const clearLastPath = useCallback(() => {
    lastPathRef.current = undefined;
  }, []);

  return {
    lastPath: lastPathRef.current,
    saveCurrentPath,
    clearLastPath,
  };
}

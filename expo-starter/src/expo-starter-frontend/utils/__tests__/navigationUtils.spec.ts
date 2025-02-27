import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { navigate, restorePreLoginScreen } from '../navigationUtils';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
vi.mock('expo-router', () => ({
  router: {
    replace: vi.fn(),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('navigationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('navigate', () => {
    it('should navigate to the specified path', () => {
      // Arrange
      const path = '/test-path';

      // Act
      navigate(path);

      // Assert
      expect(router.replace).toHaveBeenCalledWith(path);
    });

    it('should navigate to home page if navigation fails', () => {
      // Arrange
      const path = '/test-path';
      (router.replace as any).mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });

      // Act
      navigate(path);

      // Assert
      expect(router.replace).toHaveBeenCalledTimes(2);
      expect(router.replace).toHaveBeenNthCalledWith(1, path);
      expect(router.replace).toHaveBeenNthCalledWith(2, '/');
    });
  });

  describe('restorePreLoginScreen', () => {
    it('should navigate to stored path and remove it from storage', async () => {
      // Arrange
      const storedPath = '/stored-path';
      (AsyncStorage.getItem as any).mockResolvedValue(storedPath);

      // Act
      await restorePreLoginScreen();

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('lastPath');
      expect(router.replace).toHaveBeenCalledWith(storedPath);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('lastPath');
    });

    it('should navigate to home page if no stored path exists', async () => {
      // Arrange
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      // Act
      await restorePreLoginScreen();

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('lastPath');
      expect(router.replace).toHaveBeenCalledWith('/');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});

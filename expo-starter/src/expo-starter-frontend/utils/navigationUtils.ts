import { router, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Navigate to a specified path, with fallback to home page if navigation fails
 * @param path The path to navigate to
 */
export const navigate = (path: string) => {
  try {
    // Try to navigate to the stored path
    router.replace(path as Href);
  } catch {
    // If navigation fails, go to the home page
    console.warn('Navigation failed, redirecting to home');
    router.replace('/');
  }
};

/**
 * Restore the screen that was active before login
 * Retrieves the stored path from AsyncStorage and navigates to it
 */
export const restorePreLoginScreen = async () => {
  const path = await AsyncStorage.getItem('lastPath');

  if (path) {
    navigate(path);
    await AsyncStorage.removeItem('lastPath');
  } else {
    router.replace('/');
  }
};

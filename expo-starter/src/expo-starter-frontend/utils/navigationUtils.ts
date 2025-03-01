import { router, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Navigate to a specified path, with fallback to home page if navigation fails
 * @param path The path to navigate to
 */
export const navigate = (path: string) => {
  try {
    // Try to navigate to the stored path
    console.log('Navigating to:', path);
    router.replace(path as Href);
  } catch (error) {
    // If navigation fails, go to the home page
    console.warn('Navigation failed, redirecting to home:', error);
    router.replace('/');
  }
};

/**
 * Restore the screen that was active before login
 * Retrieves the stored path from AsyncStorage and navigates to it
 */
export const restorePreLoginScreen = async () => {
  console.log('Attempting to restore pre-login screen');
  try {
    const path = await AsyncStorage.getItem('lastPath');
    console.log('Retrieved path from storage:', path);

    if (path) {
      console.log('Navigating to stored path:', path);
      // Remove the path from storage before navigation to prevent loops
      await AsyncStorage.removeItem('lastPath');
      console.log('Removed path from storage');

      // Use a try-catch specifically for the navigation
      try {
        navigate(path);
        return true;
      } catch (navError) {
        console.error('Navigation error:', navError);
        // If navigation fails, try to go to home as fallback
        router.replace('/');
        return false;
      }
    } else {
      console.log('No stored path found, no navigation needed');
      return false;
    }
  } catch (error) {
    console.error('Error in restorePreLoginScreen:', error);
    return false;
  }
};

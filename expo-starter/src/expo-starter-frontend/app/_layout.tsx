import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef, useCallback } from 'react';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { initAesKeyInternal } from '@/icp/initAesKeyInternal';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const auth = useAuth();
  const { isReady, identity, logout } = auth;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Initialize AES key function
  const initAesKey = useCallback(async () => {
    // Don't run if already loading
    if (isLoading) {
      return;
    }

    try {
      setError(undefined);
      setIsLoading(true);

      await initAesKeyInternal(auth);
    } catch (err) {
      console.error('Failed to initialize AES key:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [identity, isLoading]);

  // Initialize on first load and when identity changes
  useEffect(() => {
    if (!isReady) {
      return;
    }

    initAesKey();
  }, [isReady, identity]);

  // Handle retry
  const handleRetry = () => {
    initAesKey();
  };

  // Handle close error screen
  const handleClose = () => {
    setError(undefined);
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    // Use a more direct approach for the alert
    if (Platform.OS === 'web') {
      // For web, we can't use Alert, so just proceed with logout
      console.log('Web platform detected, proceeding with logout directly');
      performLogout();
    } else {
      // For native platforms, show the confirmation dialog
      Alert.alert(
        'Confirm Logout',
        'Logging out will reset your state. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Logout cancelled'),
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: true },
      );
    }
  };

  // Separate the actual logout logic for clarity
  const performLogout = async () => {
    console.log('Performing logout...');
    try {
      await logout();
      console.log('Logout successful');
      setError(undefined);
    } catch (err) {
      console.error('Error during logout process:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.contentContainer}>
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.indicator}
          />
          <Text style={styles.loadingText}>Preparing Encryption...</Text>

          <Text style={styles.hintText}>This may take a moment...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.errorTitle}>Initialization Error</Text>
            <Text style={styles.errorText}>{error.message}</Text>

            <View style={styles.buttonContainer}>
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.buttonText}>Retry</Text>
              </Pressable>

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>

              {identity && (
                <Pressable
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Logout"
                  accessibilityHint="Logs you out of the application"
                >
                  <Text style={styles.buttonText}>Logout</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <AuthProvider value={auth}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: -80,
    paddingBottom: 20,
  },
  indicator: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localKeyButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

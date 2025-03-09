import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorProvider } from '@/contexts/ErrorContext';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';

import { useError } from '@/contexts/ErrorContext';
import { initAesKeyInternal } from '@/icp/initAesKeyInternal';

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

  return (
    <ErrorProvider>
      <RootLayoutNav />
    </ErrorProvider>
  );
}

function RootLayoutNav() {
  const auth = useAuth();
  const { isReady, identity, authError } = auth;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | undefined>(undefined);
  const { showError } = useError();

  // Initialize AES key function
  const initAesKey = useCallback(async () => {
    // Don't run if already loading
    if (isLoading) {
      return;
    }

    try {
      setError(undefined);
      setIsLoading(true);

      await initAesKeyInternal(identity);
    } catch (err) {
      console.error('Failed to initialize AES key:', err);
      setError(err);
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

  // Handle error display
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Handle auth error display
  useEffect(() => {
    if (authError) {
      showError(authError);
    }
  }, [authError, showError]);

  // Handle close error screen
  const handleClose = () => {
    setError(undefined);
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
  errorBoundaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorContentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessageContainer: {
    alignItems: 'center',
    width: '100%',
    padding: 20,
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

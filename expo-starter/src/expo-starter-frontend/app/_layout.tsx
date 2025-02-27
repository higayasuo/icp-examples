import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
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
} from 'react-native';

import { createBackend } from '@/icp/backend';

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
  const {
    isReady,
    identity,
    logout,
    decryptExistingAesKey,
    generateAesKey,
    generateAndEncryptAesKey,
    clearAesRawKey,
    getTransportPublicKey,
  } = auth;
  const [initializationStatus, setInitializationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationCompleted = useRef(false);
  const lastIdentityRef = useRef<string | null>(null);

  // Initialize AES key function
  const initAesKey = useCallback(async () => {
    // Don't run if already loading
    if (isLoading) return;

    try {
      setError(null);
      setIsLoading(true);

      // Store current identity principal for tracking changes
      lastIdentityRef.current = identity
        ? identity.getPrincipal().toString()
        : null;

      if (!identity) {
        console.log('No identity found, generating new AES key');
        setInitializationStatus('Generating new AES key...');
        await generateAesKey();
        setInitializationStatus('AES key generated');
        initializationCompleted.current = true;
        return;
      }

      clearAesRawKey();
      setInitializationStatus('Fetching keys from backend...');

      const backend = createBackend(identity);
      const transportPublicKey = getTransportPublicKey();

      console.log(
        'Fetching keys for identity:',
        identity.getPrincipal().toString(),
      );
      const keysReply = await backend.asymmetric_keys(transportPublicKey);
      const publicKey = keysReply.public_key as Uint8Array;
      const encryptedAesKey = keysReply.encrypted_aes_key?.[0] as
        | Uint8Array
        | undefined;
      const encryptedKey = keysReply.encrypted_key?.[0] as
        | Uint8Array
        | undefined;
      const principal = identity.getPrincipal();

      if (encryptedAesKey && encryptedKey) {
        console.log('Decrypting existing AES key');
        setInitializationStatus('Decrypting existing AES key...');
        await decryptExistingAesKey(
          encryptedAesKey,
          encryptedKey,
          publicKey,
          principal,
        );
      } else {
        console.log('Generating and encrypting new AES key');
        setInitializationStatus('Generating and encrypting new AES key...');
        const newEncryptedAesKey = await generateAndEncryptAesKey(
          publicKey,
          principal,
        );
        console.log('Saving new encrypted AES key');
        setInitializationStatus('Saving encrypted AES key...');
        await backend.asymmetric_save_encrypted_aes_key(newEncryptedAesKey);
      }

      setInitializationStatus('AES key initialization completed');
      initializationCompleted.current = true;
    } catch (err) {
      console.error('Failed to initialize AES key:', err);
      setInitializationStatus(`Failed to initialize AES key: ${err}`);
      setError(err instanceof Error ? err : new Error(String(err)));
      // We don't reset initializationCompleted here, as we'll use the retry button instead
    } finally {
      setIsLoading(false);
    }
  }, [
    identity,
    isLoading,
    generateAesKey,
    clearAesRawKey,
    getTransportPublicKey,
    decryptExistingAesKey,
    generateAndEncryptAesKey,
  ]);

  // Initialize on first load and when identity changes
  useEffect(() => {
    if (!isReady) return;

    const currentIdentity = identity
      ? identity.getPrincipal().toString()
      : null;
    const identityChanged = currentIdentity !== lastIdentityRef.current;

    // Log identity state for debugging
    console.log('Identity state:', {
      current: currentIdentity,
      previous: lastIdentityRef.current,
      changed: identityChanged,
      initializationCompleted: initializationCompleted.current,
    });

    // Reset initialization flag when identity changes
    if (identityChanged) {
      console.log('Identity changed, resetting initialization flag');
      initializationCompleted.current = false;
    }

    // Run initialization if:
    // 1. Identity changed (which means we need to initialize for the new identity)
    // 2. OR we've never run initialization before
    // 3. AND we're not already initialized
    if (
      ((identity && identityChanged) || lastIdentityRef.current === null) &&
      !initializationCompleted.current
    ) {
      console.log(
        'Identity changed or first initialization, running initAesKey',
      );
      initAesKey();
    }
  }, [isReady, identity, initAesKey]);

  // Handle retry
  const handleRetry = () => {
    initAesKey();
  };

  // Handle continue with local key
  const handleContinueWithLocalKey = async () => {
    setError(null);
    setInitializationStatus('Generating local AES key...');
    setIsLoading(true);

    try {
      await generateAesKey();
      setInitializationStatus('Local AES key generated');
      initializationCompleted.current = true;
    } catch (err) {
      console.error('Failed to generate local AES key:', err);
      setInitializationStatus(`Failed to generate local AES key: ${err}`);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close error screen
  const handleClose = () => {
    setError(null);
    initializationCompleted.current = true;
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    console.log('Logout button clicked');

    // For debugging - log the platform
    console.log('Platform:', Platform.OS);

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
  const performLogout = () => {
    console.log('Performing logout...');

    // Use a simpler approach with fewer async operations
    setIsLoading(true);
    setInitializationStatus('Logging out...');

    // First clear the AES key
    clearAesRawKey();
    console.log('AES key cleared');

    // Then call logout and handle the promise
    logout()
      .then(() => {
        console.log('Logout successful');
        // Reset state after successful logout
        setError(null);
        initializationCompleted.current = false;
        lastIdentityRef.current = null;

        // Generate a new AES key for anonymous user
        return generateAesKey();
      })
      .then(() => {
        console.log('New AES key generated after logout');
        setInitializationStatus('Logged out successfully');
      })
      .catch((err) => {
        console.error('Error during logout process:', err);
        setError(err instanceof Error ? err : new Error(String(err)));

        // Try to generate a key anyway
        return generateAesKey()
          .then(() => console.log('Fallback key generated'))
          .catch((keyErr) =>
            console.error('Failed to generate fallback key:', keyErr),
          );
      })
      .finally(() => {
        console.log('Logout process completed, setting isLoading to false');
        setIsLoading(false);
      });
  };

  // Add a special effect to handle post-logout initialization
  useEffect(() => {
    // If we're ready and there's no identity (after logout), ensure we have an AES key
    // But only if initialization hasn't been completed and we don't have an AES key
    if (
      isReady &&
      !identity &&
      !auth.hasAesKey &&
      !initializationCompleted.current
    ) {
      console.log('No identity and no AES key, generating new key');
      generateAesKey()
        .then(() => {
          initializationCompleted.current = true;
          console.log('Post-logout key generation completed');
        })
        .catch((err) => {
          console.error('Failed to generate AES key after logout:', err);
        });
    }
  }, [isReady, identity, auth.hasAesKey, generateAesKey]);

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
          <Text style={styles.loadingText}>Preparing Encryption</Text>
          <Text style={styles.statusText}>{initializationStatus}</Text>
          <Text style={styles.hintText}>This may take a moment...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.errorTitle}>Initialization Error</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <Text style={styles.statusText}>{initializationStatus}</Text>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>

            {identity ? (
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.localKeyButton}
                onPress={handleContinueWithLocalKey}
              >
                <Text style={styles.buttonText}>Continue with Local Key</Text>
              </Pressable>
            )}

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

          <Text style={styles.hintText}>
            {identity
              ? 'You can retry connecting to the backend or close this message to continue with limited functionality. If problems persist, logging out will reset your state.'
              : "You can retry connecting to the backend or continue with a local encryption key. A local key will work for this session but won't be synchronized with your account."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <AuthProvider value={auth}>
      <ThemeProvider
        value={{
          dark: false,
          colors: {
            primary: '#007AFF',
            background: '#fff',
            card: '#fff',
            text: '#000',
            border: '#ccc',
            notification: '#ff3b30',
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: '400',
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500',
            },
            bold: {
              fontFamily: 'System',
              fontWeight: '700',
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '900',
            },
          },
        }}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
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
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: -80,
  },
  indicator: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
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

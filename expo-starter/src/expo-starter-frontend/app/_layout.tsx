import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

import { createBackend } from '@/icp/backend';
import { Principal } from '@dfinity/principal';

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
  const {
    isReady,
    identity,
    login,
    logout,
    initializeAesKey,
    aesEncrypt,
    aesDecrypt,
    hasAesKey,
    getTransportPublicKey,
  } = useAuth();

  // Initialize AES key
  useEffect(() => {
    const initAesKey = async () => {
      try {
        const backend = createBackend(identity);
        // Get public key from backend
        const publicKey = (await backend.asymmetric_public_key()) as Uint8Array;

        // Get principal from identity
        const principal = identity
          ? identity.getPrincipal()
          : Principal.anonymous();

        // Initialize AES key
        await initializeAesKey({ publicKey, principal });
      } catch (err) {
        console.error('Failed to initialize AES key:', err);
      }
    };

    initAesKey();
  }, [identity, initializeAesKey]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider
      value={{
        identity,
        isReady,
        login,
        logout,
        initializeAesKey,
        aesEncrypt,
        aesDecrypt,
        hasAesKey,
        getTransportPublicKey,
      }}
    >
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

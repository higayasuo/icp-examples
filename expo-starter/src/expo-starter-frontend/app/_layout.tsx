import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { useIIIntegration, IIIntegrationProvider } from 'expo-ii-integration';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { View, ActivityIndicator } from 'react-native';

import { useError } from '@/contexts/ErrorContext';
import { LOCAL_IP_ADDRESS, ENV_VARS } from '@/constants';
//import { useAesKey, AesProcessingView } from '@/aes';

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
    return <LoadingView />;
  }

  return (
    <ErrorProvider>
      <RootLayoutNav />
    </ErrorProvider>
  );
}

function RootLayoutNav() {
  const auth = useIIIntegration({
    localIPAddress: LOCAL_IP_ADDRESS,
    dfxNetwork: ENV_VARS.DFX_NETWORK,
    iiIntegrationCanisterId: ENV_VARS.CANISTER_ID_II_INTEGRATION,
    iiCanisterId: ENV_VARS.CANISTER_ID_INTERNET_IDENTITY,
  });

  const { identity, authError, isReady } = auth;
  //const { isProcessingAes, aesError } = useAesKey({ identity });
  const { showError } = useError();
  //const error = authError || aesError;

  useEffect(() => {
    if (authError) {
      showError(authError);
    }
  }, [authError, showError]);

  // Memoize the main content view to prevent recreation on each render
  const mainContentView = useMemo(
    () => (
      <IIIntegrationProvider value={auth}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </IIIntegrationProvider>
    ),
    [auth],
  );

  if (!isReady) {
    return <LoadingView />;
  }

  // if (isProcessingAes) {
  //   return <AesProcessingView />;
  // }

  return mainContentView;
}

const LoadingView = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

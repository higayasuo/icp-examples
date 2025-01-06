import React from 'react';
import { Modal, Platform, StyleSheet, SafeAreaView, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { getInternetIdentityURL } from '@/icp/getInternetIdentityURL';

interface InternetIdentityWebViewProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const InternetIdentityWebView: React.FC<
  InternetIdentityWebViewProps
> = ({ isVisible, onClose, onSuccess, onError }) => {
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    console.log('Navigation state changed:', {
      ...navState,
      timestamp: new Date().toISOString(),
    });

    if (navState.loading) {
      console.log('Page is loading...');
    } else {
      console.log('Page load completed');
      if (!navState.url) {
        console.error('No URL loaded');
        onError('Failed to load authentication page');
        return;
      }
    }

    // Check for error parameters in URL
    if (navState.url.includes('error=')) {
      console.error('Authentication error detected in URL');
      onError('Authentication failed');
      return;
    }

    // Check for success callback URL
    if (navState.url.includes('/#/success')) {
      console.log('Success URL detected');
      onSuccess();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Modal
        visible={true}
        onRequestClose={onClose}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.container}>
          <WebView
            source={{ uri: getInternetIdentityURL() }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              onError(nativeEvent.description || 'WebView error occurred');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error:', nativeEvent);
              onError(`HTTP error: ${nativeEvent.statusCode}`);
            }}
            onLoadProgress={({ nativeEvent }) => {
              console.log('Load progress:', nativeEvent.progress);
            }}
            onShouldStartLoadWithRequest={(request) => {
              console.log('Should start load:', request);
              return true;
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});

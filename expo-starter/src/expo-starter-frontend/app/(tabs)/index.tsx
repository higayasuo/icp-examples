import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoggedIn from '@/components/LoggedIn';
import LoggedOut from '@/components/LoggedOut';

export default function TabOneScreen() {
  const { identity, isReady, logout } = useAuth();

  // Track identity changes
  useEffect(() => {
    console.log('TabOneScreen: identity changed', { hasIdentity: !!identity });
  }, [identity]);

  if (!isReady) {
    console.log('TabOneScreen: Not ready');
    return undefined;
  }

  return (
    <View style={styles.container} accessible={true}>
      {identity ? <LoggedIn onLogout={logout} /> : <LoggedOut />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

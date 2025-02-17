import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import LoggedIn from '@/components/LoggedIn';
import LoggedOut from '@/components/LoggedOut';
import { createBackend } from '@/icp/backend';

export default function TabOneScreen() {
  const { identity, isReady, logout, login } = useAuth();

  const backend = identity ? createBackend(identity) : undefined;
  const principal = identity ? identity.getPrincipal() : undefined;

  if (!isReady) {
    return undefined;
  }

  return (
    <View style={styles.container} accessible={true}>
      {identity ? (
        <LoggedIn onLogout={logout} backend={backend} principal={principal} />
      ) : (
        <LoggedOut onLogin={login} />
      )}
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

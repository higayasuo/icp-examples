import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import LoggedIn from '@/components/LoggedIn';
import LoggedOut from '@/components/LoggedOut';

export default function TabOneScreen() {
  const { identity, isReady, logout } = useAuth();
  console.log('identity', identity);

  if (!isReady) {
    return undefined;
  }

  return (
    <View style={styles.container} accessible={true}>
      {identity ? <LoggedIn logout={logout} /> : <LoggedOut />}
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

import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoggedIn from '@/components/LoggedIn';
import LoggedOut from '@/components/LoggedOut';

export default function TabOneScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { identity, isReady, logout } = useAuth();

  const triggerLogout = () => {
    setIsLoggedIn(false);
    logout();
  };

  useEffect(() => {
    if (identity) {
      setIsLoggedIn(true);
    }
  }, [identity]);

  if (!isReady) {
    return undefined;
  }

  return (
    <View style={styles.container} accessible={true}>
      {isLoggedIn ? <LoggedIn logout={triggerLogout} /> : <LoggedOut />}
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

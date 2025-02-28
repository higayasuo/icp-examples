import { StyleSheet, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhoAmI } from '@/components/WhoAmI';

export default function TabOneScreen() {
  const { isReady } = useAuthContext();

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container} accessible={true}>
      <WhoAmI />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
  },
});

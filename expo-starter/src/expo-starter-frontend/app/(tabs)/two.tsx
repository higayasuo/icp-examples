import { StyleSheet, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { IbeCipher } from '@/components/IbeCipher';
import { createBackend } from '@/icp/backend';

export default function TabTwoScreen() {
  const { identity, isReady } = useAuthContext();
  const backend = createBackend(identity);

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <IbeCipher backend={backend} />
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

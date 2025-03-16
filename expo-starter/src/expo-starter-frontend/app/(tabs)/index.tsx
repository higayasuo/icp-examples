import { StyleSheet, View } from 'react-native';
import { WhoAmI } from '@/components/WhoAmI';

export default function TabOneScreen() {
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

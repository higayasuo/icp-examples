import { StyleSheet, Pressable } from 'react-native';

import { useToast } from 'react-native-toast-notifications';

import { Text, View } from '@/components/Themed';
import { ENV_VARS } from '@/icp/env.generated';

export default function TabOneScreen() {
  const toast = useToast();
  const showToast = () => {
    console.log('Hello World');
    toast.show('Hello World', {
      type: 'success',
      placement: 'top',
      duration: 3000,
      animationType: 'slide-in',
      animationDuration: 500,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DFX_NETWORK: {ENV_VARS.DFX_NETWORK}</Text>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#0056b3' : '#007bff',
          padding: 15,
          borderRadius: 5,
          marginTop: 20,
        })}
        onPress={showToast}
      >
        <Text style={{ color: 'white' }}>Show Toast</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

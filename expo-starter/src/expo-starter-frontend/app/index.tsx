import { Text, View, Pressable, TextInput } from 'react-native';
import Toast from 'react-native-root-toast';
import { backend } from '../canisters';
import { useState } from 'react';

const greet = async (input: string) => {
  const result = await backend.greet(input);
  console.log('result:', result);
  Toast.show(result, {
    duration: Toast.durations.LONG,
    position: Toast.positions.TOP,
    shadow: true,
    animation: true,
    hideOnPress: true,
  });
};

export default function Index() {
  const [input, setInput] = useState('');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <TextInput
        style={{
          width: '100%',
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          padding: 10,
          borderRadius: 5,
        }}
        value={input}
        onChangeText={setInput}
        placeholder="Enter your message"
      />
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#0056b3' : '#007bff',
          padding: 15,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
        })}
        onPress={() => greet(input)}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>Send Greeting</Text>
      </Pressable>
    </View>
  );
}

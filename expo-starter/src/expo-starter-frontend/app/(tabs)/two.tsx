import { StyleSheet, View, Text } from 'react-native';
///import { useIIIntegrationContext } from '@/contexts/IIIntegrationContext';
//import { useIIIntegrationContext } from 'expo-ii-integration';
import { AesIbeCipher } from '@/components/AesIbeCipher';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Encryption Demo</Text>
        <Text style={styles.subHeaderText}>
          You can try encrypting and decrypting text using AES encryption
        </Text>
      </View>
      <AesIbeCipher />
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
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

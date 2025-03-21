import { StyleSheet, View, Text, Platform } from 'react-native';
import { useIIIntegrationContext } from 'expo-ii-integration';
import { AesIbeCipher } from '@/components/AesIbeCipher';
import { useAesKey, AesProcessingView } from 'expo-aes-vetkeys';
import { useError } from '@/contexts/ErrorContext';
import { useEffect } from 'react';
import { createAesBackend } from '@/backend';
import { aesRawKeyStorage } from '@/storage';
import { platformCrypto } from 'expo-crypto-universal';

export default function TabTwoScreen() {
  const { identity } = useIIIntegrationContext();
  const backend = createAesBackend(identity);
  const { isProcessingAes, aesError } = useAesKey({
    identity,
    backend,
    cryptoModule: platformCrypto,
    aesRawKeyStorage,
  });
  const { showError } = useError();

  useEffect(() => {
    if (aesError) {
      showError(aesError);
    }
  }, [aesError, showError]);

  if (isProcessingAes) {
    return <AesProcessingView />;
  }

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

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useIIIntegrationContext } from 'expo-ii-integration';
import { aesRawKeyStorage } from '@/storage';
import { platformCrypto } from 'expo-crypto-universal';
import { LogIn } from './LogIn';

export const AesIbeCipher = () => {
  const { identity, login } = useIIIntegrationContext();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { width } = useWindowDimensions();

  useEffect(() => {
    setInputText('');
    setResult('');
  }, [identity]);

  const handleEncryptAndDecrypt = async () => {
    // Dismiss keyboard when button is pressed (only on native)
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }

    setBusy(true);
    setError(undefined);

    try {
      const aesRawKey = await aesRawKeyStorage.retrieve();
      const plaintextBytes = new TextEncoder().encode(inputText);
      const ciphertext = await platformCrypto.aesEncryptAsync(
        plaintextBytes,
        aesRawKey,
      );
      const decrypted = await platformCrypto.aesDecryptAsync(
        ciphertext,
        aesRawKey,
      );

      setResult(new TextDecoder().decode(decrypted));
    } catch (err) {
      console.error('Error during encryption/decryption:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  // Show login message when not logged in
  if (!identity) {
    return (
      <View style={[styles.container, { maxWidth: Math.min(800, width - 32) }]}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            You should log in to use encryption features
          </Text>
          <LogIn onLogin={login} />
        </View>
      </View>
    );
  }

  const isButtonDisabled = !inputText.trim() || busy;

  // Create the main content
  const content = (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Input Text:</Text>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter text to encrypt"
          multiline
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            isButtonDisabled ? styles.buttonDisabled : styles.buttonEnabled,
            pressed && !isButtonDisabled && styles.buttonPressed,
          ]}
          onPress={handleEncryptAndDecrypt}
          disabled={isButtonDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: isButtonDisabled }}
        >
          <Text
            style={[
              styles.buttonText,
              isButtonDisabled
                ? styles.buttonTextDisabled
                : styles.buttonTextEnabled,
            ]}
          >
            Encrypt & Decrypt
          </Text>
        </Pressable>
      </View>
      <View style={styles.resultContainer}>
        <Text style={styles.label}>Result:</Text>
        <Text style={styles.resultText}>{result}</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  // Only use TouchableWithoutFeedback on native platforms
  if (Platform.OS !== 'web') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  // Return content directly on web
  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'center',
    width: '100%',
  },
  loginContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingHint: {
    marginTop: 16,
    fontSize: 13,
    color: '#0066cc',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    height: 44,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonEnabled: {
    backgroundColor: '#0066cc',
    borderColor: '#0055aa',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#bbbbbb',
  },
  buttonPressed: {
    backgroundColor: '#0055aa',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextEnabled: {
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#888888',
  },
  resultContainer: {
    marginTop: 8,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

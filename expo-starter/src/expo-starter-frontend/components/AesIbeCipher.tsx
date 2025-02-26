import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { ActorSubclass, Actor } from '@dfinity/agent';
import { _SERVICE } from '@/icp/expo-starter-backend.did';
import { useAuthContext } from '@/contexts/AuthContext';

interface AesIbeCipherProps {
  backend: ActorSubclass<_SERVICE>;
}

export const AesIbeCipher = ({ backend }: AesIbeCipherProps) => {
  const { aesEncrypt, aesDecrypt, hasAesKey } = useAuthContext();

  const [plaintext, setPlaintext] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string>('Status will appear here');
  const { width } = useWindowDimensions();

  const agent = Actor.agentOf(backend);

  useEffect(() => {
    setPlaintext('');
    setDecryptedText('');
  }, [agent]);

  const handleEncryptAndDecrypt = () => {
    if (!hasAesKey()) {
      setError('AES key not generated');
      return;
    }

    setBusy(true);
    setError(undefined);
    setStatus('Encryption in progress...');

    const plaintextBytes = new TextEncoder().encode(plaintext);

    aesEncrypt({ plaintext: plaintextBytes })
      .then((ciphertext) => {
        setStatus('Encryption completed, starting decryption...');

        // Proceed with decryption
        return aesDecrypt({ ciphertext });
      })
      .then((result) => {
        setDecryptedText(new TextDecoder().decode(result));
        setStatus('Encryption and decryption completed');
      })
      .catch((error) => {
        setError(`Error occurred: ${error.message}`);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const canEncrypt = plaintext.trim().length > 0 && !busy && hasAesKey();

  return (
    <View style={[styles.container, { maxWidth: Math.min(800, width - 32) }]}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Plain Text:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={plaintext}
            onChangeText={(text) => {
              setPlaintext(text);
              setStatus('Plain text changed');
              setDecryptedText('');
            }}
            placeholder="Enter text to encrypt"
          />
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.encryptButton,
              canEncrypt ? styles.activeButton : styles.disabledButton,
            ]}
            accessibilityRole="button"
            disabled={!canEncrypt}
            accessibilityState={{ busy, disabled: !canEncrypt }}
            onPress={handleEncryptAndDecrypt}
          >
            <Text
              style={
                canEncrypt ? styles.activeButtonText : styles.disabledButtonText
              }
            >
              Encrypt & Decrypt
            </Text>
          </Pressable>
        </View>
        <View style={styles.resultContainer}>
          <Text style={styles.label}>Decrypted Text:</Text>
          <View style={styles.decryptedContainer}>
            <TextInput
              style={[styles.input, styles.decryptedInput]}
              value={decryptedText}
              editable={false}
              placeholder="Decrypted text will appear here"
            />
          </View>
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
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
  formGroup: {
    marginBottom: 8,
    width: '100%',
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
  decryptedContainer: {
    width: '100%',
    marginBottom: 8,
  },
  decryptedInput: {
    textAlignVertical: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  encryptButton: {
    flex: 1,
    maxWidth: 180,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#0066cc', // 青系の色
  },
  disabledButton: {
    backgroundColor: '#cccccc', // グレー
  },
  activeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#666666',
    fontSize: 16,
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
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

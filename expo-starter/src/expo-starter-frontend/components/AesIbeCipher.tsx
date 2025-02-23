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
import { platformCrypto } from '@/crypto/platformCrypto';
import { principalFromAgent } from '@/icp/principalFromAgent';
import { ibeEncrypt } from '@/icp/ibeEncrypt';
import { ibeDecrypt, createTransportSecretKey } from '@/icp/ibeDecrypt';

interface AesIbeCipherProps {
  backend: ActorSubclass<_SERVICE>;
}

export const AesIbeCipher = ({ backend }: AesIbeCipherProps) => {
  const [aesRawKey, setAesRawKey] = useState<Uint8Array | undefined>();
  const [plaintext, setPlaintext] = useState('');
  const [publicKey, setPublicKey] = useState<Uint8Array | undefined>();
  const [ciphertext, setCiphertext] = useState<Uint8Array | undefined>();
  const [decryptedText, setDecryptedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string>('Status will appear here');
  const { width } = useWindowDimensions();

  const agent = Actor.agentOf(backend);

  useEffect(() => {
    setPlaintext('');
    setCiphertext(undefined);
    setDecryptedText('');
  }, [agent]);

  useEffect(() => {
    const processAesRawKey = async () => {
      setStatus('Generating AES raw key...');
      const rawKey = platformCrypto.getRandomBytes(32);
      setAesRawKey(rawKey);
      setStatus('AES raw key generated');
    };
    processAesRawKey();
  }, []);

  const getPublicKey = async (): Promise<Uint8Array> => {
    if (publicKey) {
      return publicKey;
    }

    const t = performance.now();
    const pk = (await backend.asymmetric_public_key()) as Uint8Array;
    setPublicKey(pk);
    console.log(`Getting public key took: ${performance.now() - t}ms`);
    return pk;
  };

  const handleEncrypt = async () => {
    if (!aesRawKey) {
      setError('AES raw key not generated');
      return;
    }

    setBusy(true);
    setError(undefined);
    const startTime = performance.now();
    try {
      setStatus('Encryption starting...');
      console.log('Encryption starting...');

      const t4 = performance.now();
      const encryptedBytes = await platformCrypto.aesEncryptAsync(
        new TextEncoder().encode(plaintext),
        aesRawKey,
      );
      console.log(`Encryption took: ${performance.now() - t4}ms`);

      setCiphertext(encryptedBytes);
      setStatus('Encryption done');
      console.log(
        `Total encryption process took: ${performance.now() - startTime}ms`,
      );
    } catch (error) {
      setError(`Error occurred during encryption: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrypt = async () => {
    setBusy(true);
    setError(undefined);
    const startTime = performance.now();
    try {
      if (!aesRawKey) {
        throw new Error('AES raw key not generated');
      }

      if (!ciphertext) {
        throw new Error('No ciphertext available');
      }

      setStatus('Decryption starting...');
      console.log('Decryption starting...');

      const t6 = performance.now();
      const decryptedBytes = await platformCrypto.aesDecryptAsync(
        ciphertext,
        aesRawKey,
      );
      console.log(`Decryption took: ${performance.now() - t6}ms`);

      setDecryptedText(new TextDecoder().decode(decryptedBytes));
      setStatus('Decryption done');
      console.log(
        `Total decryption process took: ${performance.now() - startTime}ms`,
      );
    } catch (error) {
      setError(`Error occurred during decryption: ${error}`);
    } finally {
      setBusy(false);
    }
  };

  const canEncrypt = plaintext.trim().length > 0 && !busy && !!aesRawKey;
  const canDecrypt = ciphertext !== undefined && !busy && !!aesRawKey;

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
              setCiphertext(undefined);
            }}
            placeholder="Enter text to encrypt"
          />
        </View>
        <Pressable
          style={[
            styles.actionButton,
            canEncrypt ? styles.activeButton : styles.disabledButton,
          ]}
          accessibilityRole="button"
          disabled={!canEncrypt}
          accessibilityState={{ busy, disabled: !canEncrypt }}
          onPress={handleEncrypt}
        >
          <Text
            style={
              canEncrypt ? styles.activeButtonText : styles.disabledButtonText
            }
          >
            Encrypt
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
        <Pressable
          style={[
            styles.actionButton,
            canDecrypt ? styles.activeButton : styles.disabledButton,
          ]}
          accessibilityRole="button"
          disabled={!canDecrypt}
          accessibilityState={{ busy, disabled: !canDecrypt }}
          onPress={handleDecrypt}
        >
          <Text
            style={
              canDecrypt ? styles.activeButtonText : styles.disabledButtonText
            }
          >
            Decrypt
          </Text>
        </Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
    alignSelf: 'center',
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
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  actionButton: {
    width: 120,
    height: 44,
    alignSelf: 'flex-end',
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

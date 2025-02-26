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
import { principalFromAgent } from '@/icp/principalFromAgent';
import { useAuthContext } from '@/contexts/AuthContext';

interface AesIbeCipherProps {
  backend: ActorSubclass<_SERVICE>;
}

export const AesIbeCipher = ({ backend }: AesIbeCipherProps) => {
  const { initializeAesKey, aesEncrypt, aesDecrypt, hasAesKey } =
    useAuthContext();
  const [encryptedAesKey, setEncryptedAesKey] = useState<
    Uint8Array | undefined
  >();
  const [plaintext, setPlaintext] = useState('');
  const [publicKey, setPublicKey] = useState<Uint8Array | undefined>();
  const [ciphertext, setCiphertext] = useState<Uint8Array | undefined>();
  const [decryptedText, setDecryptedText] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string>('Status will appear here');
  const { width } = useWindowDimensions();

  const agent = Actor.agentOf(backend);

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

  useEffect(() => {
    const generateAndEncryptAesKey = async () => {
      try {
        setStatus('Preparing to initialize AES key...');
        setBusy(true);

        // Get the public key from the backend
        const pk = await getPublicKey();

        // Get the principal from the agent
        const principal = await principalFromAgent(agent);

        // Initialize AES key with IBE encryption
        const encryptedKey = await initializeAesKey({
          publicKey: pk,
          principal,
        });

        if (encryptedKey === undefined) {
          throw new Error('Failed to initialize AES key');
        }

        setStatus('AES key initialized successfully');

        setKeyGenerated(true);
        setEncryptedAesKey(encryptedKey);
      } catch (error) {
        setError(`Error occurred during AES key initialization: ${error}`);
      } finally {
        setBusy(false);
      }
    };

    if (!hasAesKey()) {
      generateAndEncryptAesKey();
    } else {
      setStatus('Using existing AES key');
      setKeyGenerated(true);
    }
  }, [initializeAesKey, agent, hasAesKey]);

  useEffect(() => {
    setPlaintext('');
    setCiphertext(undefined);
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
      .then((result) => {
        if (result === undefined) {
          throw new Error('Encryption failed');
        }
        setCiphertext(result);
        setStatus('Encryption completed, starting decryption...');

        // Proceed with decryption
        return aesDecrypt({ ciphertext: result });
      })
      .then((result) => {
        if (result === undefined) {
          throw new Error('Decryption failed');
        }
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
              setCiphertext(undefined);
            }}
            placeholder="Enter text to encrypt"
          />
        </View>
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
  encryptButton: {
    width: 180,
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

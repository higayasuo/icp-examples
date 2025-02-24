import { useState, useEffect, useCallback } from 'react';
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
import {
  ICPWorker,
  MessageType,
  ICPWorkerResponse,
  ResponseDataMap,
} from '@/icp/ICPWorker';

interface AesIbeCipherProps {
  backend: ActorSubclass<_SERVICE>;
}

export const AesIbeCipher = ({ backend }: AesIbeCipherProps) => {
  const [worker] = useState(() => new ICPWorker());
  const [aesRawKey, setAesRawKey] = useState<Uint8Array | undefined>();
  const [encryptedAesKey, setEncryptedAesKey] = useState<
    Uint8Array | undefined
  >();
  const [plaintext, setPlaintext] = useState('');
  const [publicKey, setPublicKey] = useState<Uint8Array | undefined>();
  const [ciphertext, setCiphertext] = useState<Uint8Array | undefined>();
  const [decryptedText, setDecryptedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string>('Status will appear here');
  const { width } = useWindowDimensions();

  const agent = Actor.agentOf(backend);

  const handleWorkerResponse = useCallback((response: ICPWorkerResponse) => {
    if (response.error) {
      setError(`Error: ${response.error}`);
      setBusy(false);
      return;
    }

    if (!response.data) {
      setError('No data received from worker');
      setBusy(false);
      return;
    }

    switch (response.type) {
      case MessageType.GENERATE_AES_KEY: {
        const aesKey = response.data as Uint8Array;
        setAesRawKey(aesKey);
        setStatus('AES key generated, encrypting with IBE...');
        break;
      }
      case MessageType.IBE_ENCRYPT: {
        const encryptedKey = response.data as Uint8Array;
        setEncryptedAesKey(encryptedKey);
        setStatus('AES key encrypted with IBE');
        break;
      }
      case MessageType.AES_ENCRYPT:
        setCiphertext(response.data as Uint8Array);
        setStatus('Encryption completed');
        break;
      case MessageType.AES_DECRYPT:
        setDecryptedText(new TextDecoder().decode(response.data as Uint8Array));
        setStatus('Decryption completed');
        break;
    }
    setBusy(false);
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

  useEffect(() => {
    const generateAndEncryptAesKey = async () => {
      try {
        setStatus('Preparing to generate AES key...');
        setBusy(true);

        // Generate AES key
        const generateResponse = await worker.postMessage({
          type: MessageType.GENERATE_AES_KEY,
          data: {
            keyLength: 32,
          },
        });

        if (generateResponse.error || !generateResponse.data) {
          throw new Error(
            generateResponse.error || 'Failed to generate AES key',
          );
        }

        // Get principal and public key for IBE encryption
        const principal = await principalFromAgent(agent);
        const publicKey = await getPublicKey();

        // Encrypt AES key using IBE
        await worker.postMessage({
          type: MessageType.IBE_ENCRYPT,
          data: {
            data: generateResponse.data,
            principal,
            publicKey,
          },
        });
        setAesRawKey(generateResponse.data);
        setStatus('AES key generated, encrypting with IBE...');
      } catch (error) {
        setError(`Error occurred during key generation: ${error}`);
      } finally {
        setBusy(false);
      }
    };

    generateAndEncryptAesKey();
  }, [worker, handleWorkerResponse, agent]);

  useEffect(() => {
    setPlaintext('');
    setCiphertext(undefined);
    setDecryptedText('');
  }, [agent]);

  const handleEncrypt = () => {
    if (!aesRawKey) {
      setError('AES raw key not generated');
      return;
    }

    setBusy(true);
    setError(undefined);
    setStatus('Encryption in progress...');

    worker
      .postMessage({
        type: MessageType.AES_ENCRYPT,
        data: {
          plaintext: new TextEncoder().encode(plaintext),
          key: aesRawKey,
        },
      })
      .then(handleWorkerResponse)
      .catch((error) => {
        setError(`Error occurred during encryption: ${error.message}`);
        setBusy(false);
      });
  };

  const handleDecrypt = () => {
    if (!aesRawKey) {
      setError('AES raw key not generated');
      return;
    }

    if (!ciphertext) {
      setError('No ciphertext available');
      return;
    }

    setBusy(true);
    setError(undefined);
    setStatus('Decryption in progress...');

    worker
      .postMessage({
        type: MessageType.AES_DECRYPT,
        data: {
          ciphertext,
          key: aesRawKey,
        },
      })
      .then(handleWorkerResponse)
      .catch((error) => {
        setError(`Error occurred during decryption: ${error.message}`);
        setBusy(false);
      });
  };

  const canEncrypt = plaintext.trim().length > 0 && !busy && !!aesRawKey;
  console.log('plaintext.trim().length > 0', plaintext.trim().length > 0);
  console.log('busy', busy);
  console.log('aesRawKey', aesRawKey);
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

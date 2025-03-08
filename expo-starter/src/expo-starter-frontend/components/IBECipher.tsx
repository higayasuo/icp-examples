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
import { ibeEncrypt } from '@/icp/ibeEncrypt2';
import { ibeDecrypt } from '@/icp/ibeDecrypt2';
import { createTransportSecretKey } from '@/icp/TransportSecretKeyWrapper2';

// Utility function to allow UI thread to update
const yieldToUI = () => new Promise((resolve) => setTimeout(resolve, 0));

interface IbeCipherProps {
  backend: ActorSubclass<_SERVICE>;
}

/**
 * IBE (Identity-Based Encryption) cipher component
 * Provides UI for text encryption with input field and encryption button
 */
export const IbeCipher = ({ backend }: IbeCipherProps) => {
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

  const getPublicKey = async (): Promise<Uint8Array> => {
    if (publicKey) {
      return publicKey;
    }

    setStatus('Fetching public key...');
    await yieldToUI(); // Allow UI to update

    const t = performance.now();
    const keysReply = await backend.asymmetric_keys(new Uint8Array(0));
    const pk = keysReply.public_key as Uint8Array;
    setPublicKey(pk);
    console.log(`Getting public key took: ${performance.now() - t}ms`);
    return pk;
  };

  const handleEncrypt = async () => {
    setBusy(true);
    setError(undefined);
    const startTime = performance.now();
    setStatus('Encryption starting...');
    console.log('IBE encryption starting...');

    try {
      await yieldToUI(); // Allow UI to update

      // Get principal
      setStatus('Getting principal...');
      await yieldToUI(); // Allow UI to update
      const principal = await principalFromAgent(agent);
      console.log(`Getting principal took: ${performance.now() - startTime}ms`);

      // Get public key
      setStatus('Getting public key...');
      await yieldToUI(); // Allow UI to update
      const publicKey = await getPublicKey();

      // Generate random bytes
      setStatus('Generating random bytes...');
      await yieldToUI(); // Allow UI to update
      const t3 = performance.now();
      const seed = platformCrypto.getRandomBytes(32);
      console.log(`Generating random bytes took: ${performance.now() - t3}ms`);

      // Encrypt data
      setStatus('Encrypting data...');
      await yieldToUI(); // Allow UI to update
      const t4 = performance.now();
      const encryptedBytes = await ibeEncrypt({
        data: new TextEncoder().encode(plaintext),
        principal,
        publicKey,
        seed,
      });
      console.log(`IBE encryption took: ${performance.now() - t4}ms`);

      // Set result
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
    if (!ciphertext) {
      setError('No ciphertext available');
      return;
    }

    setBusy(true);
    setError(undefined);
    const startTime = performance.now();
    setStatus('Decryption starting...');
    console.log('IBE decryption starting...');

    try {
      await yieldToUI(); // Allow UI to update

      // Get principal
      setStatus('Getting principal...');
      await yieldToUI(); // Allow UI to update
      const principal = await principalFromAgent(agent);
      console.log(`Getting principal took: ${performance.now() - startTime}ms`);

      // Generate TSK seed
      setStatus('Generating TSK seed...');
      await yieldToUI(); // Allow UI to update
      const t2 = performance.now();
      const tskSeed = platformCrypto.getRandomBytes(32);
      console.log(`Generating TSK seed took: ${performance.now() - t2}ms`);

      // Create TSK and get public key
      setStatus('Creating TSK...');
      await yieldToUI(); // Allow UI to update
      const t3 = performance.now();
      const tsk = createTransportSecretKey(tskSeed);
      const transportPublicKey = tsk.getPublicKey();
      console.log(
        `Creating TSK and getting public key took: ${performance.now() - t3}ms`,
      );

      // Get encrypted key from the asymmetric_keys response
      setStatus('Getting encrypted key...');
      await yieldToUI(); // Allow UI to update
      const keysReply = await backend.asymmetric_keys(transportPublicKey);
      const encryptedKey = keysReply.encrypted_key?.[0] as Uint8Array;

      if (!encryptedKey) {
        throw new Error('Failed to get encrypted key from backend');
      }

      console.log(
        `Getting encrypted IBE decryption key took: ${
          performance.now() - t3
        }ms`,
      );

      // Get public key
      setStatus('Getting public key...');
      await yieldToUI(); // Allow UI to update
      const publicKey = await getPublicKey();

      // Decrypt data
      setStatus('Decrypting data...');
      await yieldToUI(); // Allow UI to update
      const t6 = performance.now();
      const decryptedBytes = await ibeDecrypt({
        ciphertext,
        principal,
        encryptedKey,
        publicKey,
        tsk,
      });
      console.log(`IBE decryption took: ${performance.now() - t6}ms`);

      // Set result
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

  const canEncrypt = plaintext.trim().length > 0 && !busy;
  const canDecrypt = ciphertext !== undefined && !busy;

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

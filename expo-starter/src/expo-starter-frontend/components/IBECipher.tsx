import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { buttonStyles, buttonTextStyles, disabledButtonStyles } from './styles';
import { ActorSubclass, Actor } from '@dfinity/agent';
import { _SERVICE } from '@/icp/expo-starter-backend.did';
import { Principal } from '@dfinity/principal';
import { platformCrypto } from '@/crypto/platformCrypto';
import { principalFromAgent } from '@/icp/principalFromAgent';
import { ibeEncrypt } from '@/icp/ibeEncrypt';
import { ibeDecrypt, createTransportSecretKey } from '@/icp/ibeDecrypt';
import { toHex } from '@/icp/hex';

interface IBECipherProps {
  backend: ActorSubclass<_SERVICE>;
}

/**
 * IBE (Identity-Based Encryption) cipher component
 * Provides UI for text encryption with input field and encryption button
 */
export const IBECipher = ({ backend }: IBECipherProps) => {
  const [plaintext, setPlaintext] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { width } = useWindowDimensions();

  const agent = Actor.agentOf(backend);

  useEffect(() => {
    setPlaintext('');
    setEncryptedText('');
    setDecryptedText('');
  }, [agent]);

  const handleEncrypt = async () => {
    setBusy(true);
    setError(undefined);
    const startTime = performance.now();
    try {
      setEncryptedText('IBE encryption starting...');
      console.log('IBE encryption starting...');

      const t1 = performance.now();
      const principal = await principalFromAgent(agent);
      console.log(`Getting principal took: ${performance.now() - t1}ms`);

      const t2 = performance.now();
      const publicKey = await backend.ibe_encryption_key();
      console.log(`Getting public key took: ${performance.now() - t2}ms`);

      const t3 = performance.now();
      const seed = platformCrypto.getRandomBytes(32);
      console.log(`Generating random bytes took: ${performance.now() - t3}ms`);

      const t4 = performance.now();
      const encryptedBytes = await ibeEncrypt({
        plaintext,
        principal,
        publicKey,
        seed,
      });
      console.log(`IBE encryption took: ${performance.now() - t4}ms`);

      const t5 = performance.now();
      const encryptedHex = toHex(encryptedBytes);
      console.log(`Converting to hex took: ${performance.now() - t5}ms`);

      setEncryptedText(encryptedHex);
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
      setDecryptedText('IBE-decryption starting...');
      console.log('IBE decryption starting...');

      const t1 = performance.now();
      const principal = await principalFromAgent(agent);
      console.log(`Getting principal took: ${performance.now() - t1}ms`);

      const t2 = performance.now();
      const tskSeed = platformCrypto.getRandomBytes(32);
      console.log(`Generating TSK seed took: ${performance.now() - t2}ms`);

      const t3 = performance.now();
      const tsk = createTransportSecretKey(tskSeed);
      const transportPublicKey = tsk.getPublicKey();
      console.log(
        `Creating TSK and getting public key took: ${performance.now() - t3}ms`,
      );

      const t4 = performance.now();
      const encryptedKey =
        await backend.encrypted_ibe_decryption_key_for_caller(
          transportPublicKey,
        );
      console.log(
        `Getting encrypted IBE decryption key took: ${
          performance.now() - t4
        }ms`,
      );

      const t5 = performance.now();
      const publicKey = await backend.ibe_encryption_key();
      console.log(`Getting public key took: ${performance.now() - t5}ms`);

      const t6 = performance.now();
      const decryptedText = await ibeDecrypt({
        ciphertext: encryptedText,
        principal,
        encryptedKey,
        publicKey,
        tsk,
      });
      console.log(`IBE decryption took: ${performance.now() - t6}ms`);

      setDecryptedText(decryptedText);
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
  const canDecrypt = encryptedText.length > 0 && !busy;

  return (
    <View style={[styles.container, { maxWidth: Math.min(800, width - 32) }]}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Plain Text:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={plaintext}
            onChangeText={setPlaintext}
            placeholder="Enter text to encrypt"
          />
        </View>
        <Pressable
          style={[
            !canEncrypt ? disabledButtonStyles : buttonStyles,
            styles.actionButton,
          ]}
          accessibilityRole="button"
          disabled={!canEncrypt}
          accessibilityState={{ busy, disabled: !canEncrypt }}
          onPress={handleEncrypt}
        >
          <Text style={buttonTextStyles}>Encrypt</Text>
        </Pressable>
      </View>
      <View style={styles.resultContainer}>
        <Text style={styles.label}>Encrypted Text:</Text>
        <View style={styles.encryptedContainer}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.resultText}>
              {encryptedText || 'Encrypted text will appear here'}
            </Text>
          </ScrollView>
        </View>
        <Pressable
          style={[
            !canDecrypt ? disabledButtonStyles : buttonStyles,
            styles.actionButton,
          ]}
          accessibilityRole="button"
          disabled={!canDecrypt}
          accessibilityState={{ busy, disabled: !canDecrypt }}
          onPress={handleDecrypt}
        >
          <Text style={buttonTextStyles}>Decrypt</Text>
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
  formGroup: {
    marginBottom: 16,
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
  encryptedContainer: {
    width: '100%',
    marginBottom: 4,
    minHeight: 100,
  },
  scrollView: {
    maxHeight: 150,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  decryptedContainer: {
    width: '100%',
  },
  decryptedInput: {
    textAlignVertical: 'center',
  },
  actionButton: {
    width: 120,
    height: 44,
    alignSelf: 'flex-end',
  },
  resultContainer: {
    marginTop: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    padding: 8,
    flexWrap: 'wrap',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

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
    try {
      setEncryptedText('IBE encryption starting...');
      const principal = await principalFromAgent(agent);
      const publicKey = await backend.ibe_encryption_key();
      const seed = platformCrypto.getRandomBytes(32);
      const encryptedBytes = await ibeEncrypt({
        plaintext,
        principal,
        publicKey,
        seed,
      });
      const encryptedHex = toHex(encryptedBytes);
      setEncryptedText(encryptedHex);
    } catch (error) {
      setError(`Error occurred during encryption: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrypt = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setDecryptedText('IBE-decryption starting...');
      const principal = await principalFromAgent(agent);
      const tskSeed = platformCrypto.getRandomBytes(32);
      const tsk = createTransportSecretKey(tskSeed);
      const transportPublicKey = tsk.getPublicKey();
      const encryptedKey =
        await backend.encrypted_ibe_decryption_key_for_caller(
          transportPublicKey,
        );
      const publicKey = await backend.ibe_encryption_key();
      const decryptedText = await ibeDecrypt({
        ciphertext: encryptedText,
        principal,
        encryptedKey,
        publicKey,
        tsk,
      });
      setDecryptedText(decryptedText);
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

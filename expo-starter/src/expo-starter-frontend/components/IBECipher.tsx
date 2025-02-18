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
import * as vetkd from 'ic-vetkd-utils';
import { hex_decode, hex_encode } from '@/utils/hex';
import { platformCrypto } from '@/crypto/platformCrypto';

interface IBECipherProps {
  backend: ActorSubclass<_SERVICE> | undefined;
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

  const agent = backend ? Actor.agentOf(backend) : undefined;

  useEffect(() => {
    setPlaintext('');
    setEncryptedText('');
    setDecryptedText('');
  }, [agent]);

  const handleEncrypt = async () => {
    if (!plaintext.trim()) return;
    if (!backend) {
      setError('Backend is not ready');
      return;
    }

    const agent = Actor.agentOf(backend);
    const ibe_principal =
      (await agent?.getPrincipal()) || Principal.anonymous();

    setBusy(true);
    setError(undefined);
    try {
      // Get the IBE encryption key
      setEncryptedText('Fetching IBE encryption key...');
      const pk_bytes_hex = await backend.ibe_encryption_key();
      console.log('pk_bytes_hex', pk_bytes_hex);

      // Prepare for IBE encryption
      setEncryptedText('Preparing IBE-encryption...');
      const message_encoded = new TextEncoder().encode(plaintext);
      const seed = platformCrypto.getRandomBytes(32);

      // Perform IBE encryption
      setEncryptedText(
        `IBE-encrypting for principal ${ibe_principal.toText()}...`,
      );

      const ibe_ciphertext = vetkd.IBECiphertext.encrypt(
        hex_decode(pk_bytes_hex),
        ibe_principal.toUint8Array(),
        message_encoded,
        seed,
      );
      const encryptedBytes = ibe_ciphertext.serialize();
      const encryptedHex = hex_encode(encryptedBytes);
      setEncryptedText(encryptedHex);
    } catch (error) {
      setError(`Error occurred during encryption: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedText) return;
    if (!backend) {
      setError('Backend is not ready');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      setDecryptedText('Preparing IBE-decryption...');
      const tsk_seed = platformCrypto.getRandomBytes(32);
      const tsk = new vetkd.TransportSecretKey(tsk_seed);
      setDecryptedText('Fetching IBE decryption key...');
      const ek_bytes_hex =
        await backend.encrypted_ibe_decryption_key_for_caller(tsk.public_key());
      setDecryptedText('Fetching IBE enryption key...');
      console.log('ek_bytes_hex', ek_bytes_hex);
      const pk_bytes_hex = await backend.ibe_encryption_key();
      console.log('pk_bytes_hex', pk_bytes_hex);
      const agent = Actor.agentOf(backend);
      const ibe_principal =
        (await agent?.getPrincipal()) || Principal.anonymous();

      const k_bytes = tsk.decrypt(
        hex_decode(ek_bytes_hex),
        hex_decode(pk_bytes_hex),
        ibe_principal.toUint8Array(),
      );
      console.log('k_bytes', k_bytes);
      const ibe_ciphertext = vetkd.IBECiphertext.deserialize(
        hex_decode(encryptedText),
      );
      const ibe_plaintext = ibe_ciphertext.decrypt(k_bytes);
      setDecryptedText(new TextDecoder().decode(ibe_plaintext));
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

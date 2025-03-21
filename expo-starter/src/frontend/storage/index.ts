import { Platform } from 'react-native';
import { WebSecureStorage } from 'expo-storage-universal-web';
import { NativeSecureStorage } from 'expo-storage-universal-native';
import { AesRawKeyStorage } from 'expo-aes-vetkeys';

export const secureStorage =
  Platform.OS === 'web' ? new WebSecureStorage() : new NativeSecureStorage();

export const aesRawKeyStorage = new AesRawKeyStorage(secureStorage);

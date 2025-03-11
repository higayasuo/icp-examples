import { Platform } from 'react-native';
import { WebStorage } from './WebStorage';
import { NativeStorage } from './NativeStorage';

export const platformStorage =
  Platform.OS === 'web' ? new WebStorage() : new NativeStorage();

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { Storage } from './Storage';

export class NativeStorage implements Storage {
  constructor() {}

  async getFromStorage(key: string): Promise<string | undefined> {
    const startTime = performance.now();
    const result = (await AsyncStorage.getItem(key)) ?? undefined;
    console.log(`getFromStorage took ${performance.now() - startTime}ms`);
    return result;
  }

  async saveToStorage(key: string, value: string): Promise<void> {
    const startTime = performance.now();
    await AsyncStorage.setItem(key, value);
    console.log(`saveToStorage took ${performance.now() - startTime}ms`);
  }

  async removeFromStorage(key: string): Promise<void> {
    const startTime = performance.now();
    await AsyncStorage.removeItem(key);
    console.log(`removeFromStorage took ${performance.now() - startTime}ms`);
  }

  async getFromSecureStorage(key: string): Promise<string | undefined> {
    const startTime = performance.now();
    const result = (await SecureStore.getItemAsync(key)) ?? undefined;
    console.log(`getFromSecureStorage took ${performance.now() - startTime}ms`);
    return result;
  }

  async saveToSecureStorage(key: string, value: string): Promise<void> {
    const startTime = performance.now();
    await SecureStore.setItemAsync(key, value);
    console.log(`saveToSecureStorage took ${performance.now() - startTime}ms`);
  }

  async removeFromSecureStorage(key: string): Promise<void> {
    const startTime = performance.now();
    await SecureStore.deleteItemAsync(key);
    console.log(
      `removeFromSecureStorage took ${performance.now() - startTime}ms`,
    );
  }
}

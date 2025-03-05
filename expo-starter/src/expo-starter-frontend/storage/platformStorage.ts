import { Platform } from 'react-native';
import { WebStorage } from './WebStorage';
import { openDatabase } from './db';
import { NativeStorage } from './NativeStorage';
import { Storage } from './Storage';

let storage: Storage | undefined;

export const getStorage = async (): Promise<Storage> => {
  if (storage) {
    return storage;
  }

  if (Platform.OS === 'web') {
    const db = await openDatabase();
    storage = new WebStorage(db);
  } else {
    storage = new NativeStorage();
  }

  return storage;
};

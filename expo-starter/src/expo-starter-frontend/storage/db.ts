import { IDBPDatabase, openDB } from 'idb';
import { DB_VERSION, DB_NAME, STORE_NAME } from './dbConstants';

export interface DatabaseWrapper {
  get: <T>(key: string) => Promise<T | undefined>;
  put: <T>(key: string, value: T) => Promise<IDBValidKey>;
  delete: (key: string) => Promise<void>;
}

export type Database = IDBPDatabase<unknown>;

export type OpenDatabaseArgs = {
  dbName?: string;
  storeName?: string;
  version?: number;
};

export const openDatabase = async ({
  dbName = DB_NAME,
  storeName = STORE_NAME,
  version = DB_VERSION,
}: OpenDatabaseArgs = {}): Promise<DatabaseWrapper> => {
  const db = await openDB(dbName, version, {
    upgrade: (database) => {
      if (database.objectStoreNames.contains(storeName)) {
        database.clear(storeName);
      }
      database.createObjectStore(storeName);
    },
  });

  return {
    get: (key: IDBValidKey) => db.get(storeName, key),
    put: <T>(key: IDBValidKey, value: T) => db.put(storeName, value, key),
    delete: (key: IDBValidKey) => db.delete(storeName, key),
  };
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebStorage } from '../WebStorage';
import { DatabaseWrapper, openDatabase } from '../db';
import 'fake-indexeddb/auto';

let testCounter = 0;

const testDb = async () => {
  return await openDatabase({
    dbName: 'db-' + testCounter,
    storeName: 'store-' + testCounter,
  });
};

beforeEach(() => {
  testCounter += 1;
});

describe('WebStorage', () => {
  describe('Regular storage operations', () => {
    it('should get a value from storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'testValue';

      await storage.saveToStorage('testKey', testValue);

      const result = await storage.getFromStorage('testKey');

      expect(result).toEqual(testValue);
    });

    it('should save a value to storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'test value';

      await storage.saveToStorage('testKey', testValue);

      const result = await storage.getFromStorage('testKey');
      expect(result).toEqual(testValue);
    });

    it('should remove a value from storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'test value';

      // First save a value
      await storage.saveToStorage('testKey', testValue);

      // Verify it's there
      const beforeDelete = await storage.getFromStorage('testKey');
      expect(beforeDelete).toEqual(testValue);

      // Delete it
      await storage.removeFromStorage('testKey');

      // Verify it's gone
      const afterDelete = await storage.getFromStorage('testKey');
      expect(afterDelete).toBeUndefined();
    });

    it('should return undefined for non-existent keys', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);

      const result = await storage.getFromStorage('nonExistentKey');

      expect(result).toBeUndefined();
    });
  });

  describe('Secure storage operations', () => {
    it('should get a value from secure storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'secure value';

      await storage.saveToSecureStorage('secureKey', testValue);

      const result = await storage.getFromSecureStorage('secureKey');

      expect(result).toEqual(testValue);
    });

    it('should save a value to secure storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'secure test value';

      await storage.saveToSecureStorage('secureKey', testValue);

      const result = await storage.getFromSecureStorage('secureKey');
      expect(result).toEqual(testValue);
    });

    it('should remove a value from secure storage', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);
      const testValue = 'secure test value';

      // First save a value
      await storage.saveToSecureStorage('secureKey', testValue);

      // Verify it's there
      const beforeDelete = await storage.getFromSecureStorage('secureKey');
      expect(beforeDelete).toEqual(testValue);

      // Delete it
      await storage.removeFromSecureStorage('secureKey');

      // Verify it's gone
      const afterDelete = await storage.getFromSecureStorage('secureKey');
      expect(afterDelete).toBeUndefined();
    });
  });

  describe('Integration between regular and secure storage', () => {
    it('should use the same underlying storage for both regular and secure operations', async () => {
      const db = await testDb();
      const storage = new WebStorage(db);

      // Test that secure storage operations call the same methods as regular storage
      const getFromStorageSpy = vi.spyOn(storage, 'getFromStorage');
      const saveToStorageSpy = vi.spyOn(storage, 'saveToStorage');
      const removeFromStorageSpy = vi.spyOn(storage, 'removeFromStorage');

      await storage.getFromSecureStorage('testKey');
      await storage.saveToSecureStorage('testKey', 'value');
      await storage.removeFromSecureStorage('testKey');

      expect(getFromStorageSpy).toHaveBeenCalledWith('testKey');
      expect(saveToStorageSpy).toHaveBeenCalledWith('testKey', 'value');
      expect(removeFromStorageSpy).toHaveBeenCalledWith('testKey');
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from the database', async () => {
      const db = await testDb();
      // Create a storage instance with a db that will throw an error
      const errorDb: DatabaseWrapper = {
        get: () => Promise.reject(new Error('Database error')),
        put: () => Promise.reject(new Error('Database error')),
        delete: () => Promise.reject(new Error('Database error')),
      };
      const storage = new WebStorage(errorDb);

      await expect(storage.getFromStorage('testKey')).rejects.toThrow(
        'Database error',
      );
    });
  });
});

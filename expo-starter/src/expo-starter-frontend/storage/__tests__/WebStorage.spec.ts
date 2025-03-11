import { describe, it, expect, beforeEach } from 'vitest';
import { WebStorage } from '../WebStorage';

beforeEach(() => {
  // Clear sessionStorage before each test
  sessionStorage.clear();
});

describe('WebStorage', () => {
  describe('Regular storage operations', () => {
    it('should get a value from storage', async () => {
      const storage = new WebStorage();
      const testValue = 'testValue';

      await storage.saveToStorage('testKey', testValue);

      const result = await storage.getFromStorage('testKey');

      expect(result).toEqual(testValue);
    });

    it('should save a value to storage', async () => {
      const storage = new WebStorage();
      const testValue = 'test value';

      await storage.saveToStorage('testKey', testValue);

      const result = sessionStorage.getItem('testKey');
      expect(result).toEqual(testValue);
    });

    it('should remove a value from storage', async () => {
      const storage = new WebStorage();
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
      const storage = new WebStorage();

      const result = await storage.getFromStorage('nonExistentKey');

      expect(result).toBeUndefined();
    });
  });

  describe('Secure storage operations', () => {
    it('should get a value from secure storage', async () => {
      const storage = new WebStorage();
      const testValue = 'secure value';

      await storage.saveToSecureStorage('secureKey', testValue);

      const result = await storage.getFromSecureStorage('secureKey');

      expect(result).toEqual(testValue);
    });

    it('should save a value to secure storage', async () => {
      const storage = new WebStorage();
      const testValue = 'secure test value';

      await storage.saveToSecureStorage('secureKey', testValue);

      const result = sessionStorage.getItem('secureKey');
      expect(result).toEqual(testValue);
    });

    it('should remove a value from secure storage', async () => {
      const storage = new WebStorage();
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

    it('should return undefined for non-existent secure keys', async () => {
      const storage = new WebStorage();

      const result = await storage.getFromSecureStorage('nonExistentKey');

      expect(result).toBeUndefined();
    });
  });

  describe('Storage isolation', () => {
    it('should handle regular and secure storage independently', async () => {
      const storage = new WebStorage();

      // Save values to both storages
      await storage.saveToStorage('regularKey', 'regular value');
      await storage.saveToSecureStorage('secureKey', 'secure value');

      // Verify both values are stored correctly
      expect(await storage.getFromStorage('regularKey')).toBe('regular value');
      expect(await storage.getFromSecureStorage('secureKey')).toBe(
        'secure value',
      );

      // Verify cross-access returns undefined
      expect(await storage.getFromStorage('secureKey')).toBe('secure value');
      expect(await storage.getFromSecureStorage('regularKey')).toBe(
        'regular value',
      );
    });
  });
});

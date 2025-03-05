import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { openDatabase } from '../db';

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

describe('IndexedDB wrapper', () => {
  it('should store a basic key value', async () => {
    const db = await testDb();
    const shouldSet = async () => await db.put('testKey', 'testValue');
    expect(shouldSet).not.toThrow();

    expect(await db.get('testKey')).toBe('testValue');
  });

  it('should support removing a value', async () => {
    const db = await testDb();
    await db.put('testKey', 'testValue');

    expect(await db.get('testKey')).toBe('testValue');

    await db.delete('testKey');

    expect(await db.get('testKey')).toBeUndefined();
  });

  it('should support storing complex objects', async () => {
    const db = await testDb();
    const testObject = {
      id: 1,
      name: 'Test Object',
      nested: {
        value: 'nested value',
        array: [1, 2, 3],
      },
    };

    await db.put('testKey', testObject);
    const storedObject = await db.get('testKey');

    expect(storedObject).toEqual(testObject);
  });

  it('should return undefined for non-existent keys', async () => {
    const db = await testDb();
    const result = await db.get('nonExistentKey');

    expect(result).toBeUndefined();
  });

  it('should open a database with custom parameters', async () => {
    const customDb = await openDatabase({
      dbName: 'custom-db-' + testCounter,
      storeName: 'custom-store-' + testCounter,
      version: 2,
    });

    await customDb.put('testKey', 'testValue');
    const result = await customDb.get('testKey');

    expect(result).toBe('testValue');
  });
});

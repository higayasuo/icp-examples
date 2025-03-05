import { Storage } from './Storage';
import { DatabaseWrapper } from './db';

export class WebStorage implements Storage {
  private db: DatabaseWrapper;

  constructor(db: DatabaseWrapper) {
    this.db = db;
  }

  async getFromStorage(key: string): Promise<string | undefined> {
    const startTime = performance.now();
    const result = await this.db.get<string>(key);
    console.log(`getFromStorage took ${performance.now() - startTime}ms`);
    return result;
  }

  async saveToStorage(key: string, value: string): Promise<void> {
    const startTime = performance.now();
    await this.db.put(key, value);
    console.log(`saveToStorage took ${performance.now() - startTime}ms`);
  }

  async removeFromStorage(key: string): Promise<void> {
    const startTime = performance.now();
    await this.db.delete(key);
    console.log(`removeFromStorage took ${performance.now() - startTime}ms`);
  }

  async getFromSecureStorage(key: string): Promise<string | undefined> {
    return this.getFromStorage(key);
  }

  async saveToSecureStorage(key: string, value: string): Promise<void> {
    await this.saveToStorage(key, value);
  }

  async removeFromSecureStorage(key: string): Promise<void> {
    await this.removeFromStorage(key);
  }
}

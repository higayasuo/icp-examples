import { AesOperations } from './AesOperations';

/**
 * Singleton instance of AesOperations
 * Use this when you need a shared instance across the application
 */
let instance: AesOperations | null = null;

export function getAesOperationsInstance(): AesOperations {
  if (!instance) {
    instance = new AesOperations();
  }
  return instance;
}

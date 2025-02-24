import { vi } from 'vitest';

// Mock react-native modules
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.web || obj.default,
  },
}));

// Mock expo modules if needed
vi.mock('expo-crypto', () => ({
  getRandomValues: vi.fn(),
}));

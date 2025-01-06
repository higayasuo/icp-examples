import 'react-native-get-random-values';
import 'react-native-polyfill-globals/auto';
import { TextEncoder } from 'text-encoding';

// Set up TextEncoder globally
(globalThis as any).TextEncoder = TextEncoder;
(window as any).TextEncoder = TextEncoder;

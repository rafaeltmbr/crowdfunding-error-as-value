import 'vitest';
import { Result } from '../domain/values/Result';

interface CustomMatchers<R = unknown> {
  toBeSuccess(): R;
  toBeFailureWithMessage(message: string): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

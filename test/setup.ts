import { afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  // Provide a default mock fetch; individual tests can override as needed.
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.resetAllMocks();
});

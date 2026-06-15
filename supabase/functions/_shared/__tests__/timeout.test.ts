// Timeout handling (docs/08 §2): a slow call maps to provider_unavailable → the
// child-safe "nap" copy; a fast call resolves; real errors propagate unchanged.
import { AppError } from '../errors.ts';
import { strings } from '../strings.ts';
import { withTimeout } from '../timeout.ts';

describe('withTimeout', () => {
  it('resolves a fast promise', async () => {
    await expect(withTimeout(Promise.resolve('done'), 1000)).resolves.toBe('done');
  });

  it('rejects a slow promise as provider_unavailable (nap message)', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('late'), 80));
    await expect(withTimeout(slow, 10)).rejects.toMatchObject({
      code: 'provider_unavailable',
      userMessage: strings.errors.aiNap,
      retryable: true,
    });
  });

  it('propagates a non-timeout error unchanged', async () => {
    const failing = Promise.reject(new AppError('rate_limited'));
    await expect(withTimeout(failing, 1000)).rejects.toMatchObject({ code: 'rate_limited' });
  });
});

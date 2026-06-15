// Provider timeout handling (docs/03 §12, docs/05 §12).
//
// V1 is synchronous: each function caps its upstream provider call below the Edge
// platform wall-clock limit and fails gracefully with the child-safe "nap"
// message (provider_unavailable) on timeout. No job queue in V1.
import { AppError } from './errors.ts';

export function withTimeout<T>(promise: Promise<T>, ms: number, detail = 'provider call'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError('provider_unavailable', `${detail} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

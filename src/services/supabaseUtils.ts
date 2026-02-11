export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`${label} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]) as Promise<T>;
}

export interface RetryOptions {
  retries: number;
  backoffMs: number;
  retryIf?: (e: unknown) => boolean;
}

export async function withRetry<T>(fn: () => PromiseLike<T>, opts: RetryOptions): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      const should = opts.retries > 0 && (opts.retryIf ? opts.retryIf(e) : true);
      if (!should || attempt > opts.retries) throw e;
      await new Promise(r => setTimeout(r, opts.backoffMs));
    }
  }
}

import { fromPostgrest, fromUnknown, isRetryable, createAppError, type AppError } from './error';

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 500;

export type SafeResult<T> = { data: T | null; error: AppError | null };

export async function safeQuery<T>(label: string, exec: () => PromiseLike<T>): Promise<SafeResult<T>> {
  try {
    const result = await withRetry(
      () => withTimeout(exec(), DEFAULT_TIMEOUT, label),
      { retries: DEFAULT_RETRIES, backoffMs: DEFAULT_BACKOFF, retryIf: (e) => isRetryable(mapToError(e).code) }
    );
    return { data: result, error: null };
  } catch (e) {
    const err = mapToError(e, { label });
    return { data: null, error: err };
  }
}

function mapToError(e: unknown, ctx?: Record<string, unknown>): AppError {
  if ((e as any)?.code || (e as any)?.message) {
    return fromPostgrest(e, ctx);
  }
  if (e instanceof Error && /timeout/i.test(e.message)) {
    return createAppError('timeout', e.message, ctx, e);
  }
  return fromUnknown(e, ctx);
}




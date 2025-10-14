export type AppErrorCode =
  | 'timeout'
  | 'network'
  | 'not_found'
  | 'forbidden'
  | 'unauthorized'
  | 'conflict'
  | 'validation'
  | 'db'
  | 'unknown';

export interface AppError extends Error {
  code: AppErrorCode;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export function createAppError(code: AppErrorCode, message: string, ctx?: Record<string, unknown>, cause?: unknown): AppError {
  const err = new Error(message) as AppError;
  err.code = code;
  err.context = ctx;
  err.cause = cause;
  return err;
}

export function isRetryable(code: AppErrorCode): boolean {
  return code === 'network' || code === 'timeout';
}

export function fromPostgrest(error: any, ctx?: Record<string, unknown>): AppError {
  const msg: string = error?.message || 'Database error';
  const code = String(error?.code || '').toUpperCase();
  if (code === 'PGRST116') return createAppError('not_found', msg, ctx, error);
  if (code === '42501') return createAppError('forbidden', msg, ctx, error);
  if (code === '28P01') return createAppError('unauthorized', msg, ctx, error);
  if (code === '23505') return createAppError('conflict', msg, ctx, error);
  return createAppError('db', msg, ctx, error);
}

export function fromUnknown(e: unknown, ctx?: Record<string, unknown>): AppError {
  if ((e as any)?.code && (e as any)?.message) {
    return createAppError(((e as any).code as AppErrorCode) || 'unknown', (e as any).message, ctx, e);
  }
  if (e instanceof Error) {
    return createAppError('unknown', e.message, ctx, e);
  }
  return createAppError('unknown', 'Unknown error', ctx, e);
}



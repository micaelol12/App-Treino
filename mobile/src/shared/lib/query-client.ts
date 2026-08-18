import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { reportError } from '@/shared/telemetry/error-reporter';

const NON_RETRYABLE_FAILURES = new Set([
  'configuration',
  'duplicate',
  'duplicate-order',
  'invalid-data',
  'not-found',
  'permission-denied',
  'too-many-sets',
]);

function failureCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

export function shouldRetryRemoteQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  const code = failureCode(error);
  return !code || !NON_RETRYABLE_FAILURES.has(code);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const code = failureCode(error);
        reportError('remote_operation_failed', error, {
          ...(code ? { failureCode: code } : {}),
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const code = failureCode(error);
        reportError('remote_operation_failed', error, {
          ...(code ? { failureCode: code } : {}),
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryRemoteQuery,
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
  });
}

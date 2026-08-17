import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/presentation/auth-context';

import { WeightService } from '../application/weight-service';
import type { WeightEntryDraft } from '../domain/weight-rules';
import { useWeightRepository } from './weight-context';

const PAGE_SIZE = 30;

function queryKey(userId: string | undefined) {
  return ['weight-history', userId] as const;
}

export function useWeightHistory() {
  const { session } = useAuth();
  const repository = useWeightRepository();
  const service = useMemo(() => new WeightService(repository), [repository]);
  const userId = session?.uid;

  return useInfiniteQuery({
    queryKey: queryKey(userId),
    enabled: Boolean(userId),
    initialPageParam: undefined as
      { readonly id: string; readonly recordedOn: string } | undefined,
    queryFn: ({ pageParam }) => {
      if (!userId) throw new Error('Authenticated user required');
      return service.listPage(userId, PAGE_SIZE, pageParam);
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useWeightUpsert() {
  const { session } = useAuth();
  const repository = useWeightRepository();
  const service = useMemo(() => new WeightService(repository), [repository]);
  const queryClient = useQueryClient();
  const userId = session?.uid;

  return useMutation({
    mutationFn: (draft: WeightEntryDraft) => {
      if (!userId) throw new Error('Authenticated user required');
      return service.upsert(userId, draft);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(userId) }),
  });
}

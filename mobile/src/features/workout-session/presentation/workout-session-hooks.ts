import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { CompleteWorkoutSession } from '../application/complete-workout-session';
import type { WorkoutSessionDraft } from '../domain/workout-session-draft';
import {
  prepareWorkoutHistoryUpdate,
  type WorkoutHistoryEditDraft,
} from '../domain/workout-history';
import { useAuth } from '../../auth/presentation/auth-context';

import { useWorkoutSessionRepository } from './workout-session-context';

export function useCompleteWorkoutSession() {
  const { session } = useAuth();
  const repository = useWorkoutSessionRepository();
  const useCase = useMemo(() => new CompleteWorkoutSession(repository), [repository]);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: WorkoutSessionDraft) => {
      if (!session) throw new Error('Authenticated user required');
      return useCase.execute(session.uid, draft);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workout-history', session?.uid] }),
        queryClient.invalidateQueries({ queryKey: ['exercise-history', session?.uid] }),
        queryClient.invalidateQueries({ queryKey: ['exercise-progress', session?.uid] }),
      ]),
  });
}

const HISTORY_PAGE_SIZE = 500;

export function useWorkoutHistory() {
  const { session } = useAuth();
  const repository = useWorkoutSessionRepository();
  const userId = session?.uid;

  return useInfiniteQuery({
    queryKey: ['workout-history', userId],
    enabled: Boolean(userId),
    initialPageParam: undefined as
      { readonly id: string; readonly performedOn: string } | undefined,
    queryFn: ({ pageParam }) => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.listHistoryPage(userId, HISTORY_PAGE_SIZE, pageParam);
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useExerciseHistory(
  exerciseName: string,
  exerciseId: string | undefined,
  enabled: boolean,
) {
  const { session } = useAuth();
  const repository = useWorkoutSessionRepository();
  const userId = session?.uid;

  return useQuery({
    queryKey: ['exercise-history', userId, exerciseId, exerciseName],
    enabled: Boolean(userId && exerciseName && enabled),
    queryFn: () => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.listExerciseHistory(userId, exerciseId, exerciseName, 100);
    },
  });
}

function invalidateHistoryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['workout-history', userId] }),
    queryClient.invalidateQueries({ queryKey: ['exercise-history', userId] }),
    queryClient.invalidateQueries({ queryKey: ['exercise-progress', userId] }),
  ]);
}

export function useWorkoutHistoryActions() {
  const { session } = useAuth();
  const repository = useWorkoutSessionRepository();
  const queryClient = useQueryClient();
  const userId = session?.uid;

  const update = useMutation({
    mutationFn: (draft: WorkoutHistoryEditDraft) => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.updateHistory(userId, prepareWorkoutHistoryUpdate(draft));
    },
    onSuccess: () => invalidateHistoryQueries(queryClient, userId),
  });

  const remove = useMutation({
    mutationFn: (documentIds: readonly string[]) => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.deleteHistory(userId, documentIds);
    },
    onSuccess: () => invalidateHistoryQueries(queryClient, userId),
  });

  return { remove, update };
}

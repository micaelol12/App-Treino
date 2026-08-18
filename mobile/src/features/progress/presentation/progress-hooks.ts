import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/presentation/auth-context';

import { useProgressRepository } from './progress-context';

const PAGE_SIZE = 200;

export function useExerciseProgress(exerciseId: string, exerciseName: string) {
  const { session } = useAuth();
  const repository = useProgressRepository();
  const userId = session?.uid;

  return useInfiniteQuery({
    queryKey: ['exercise-progress', userId, exerciseId, exerciseName],
    enabled: Boolean(userId && exerciseName),
    initialPageParam: undefined as
      { readonly id: string; readonly performedOn: string } | undefined,
    queryFn: ({ pageParam }) => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.listExercisePage(
        userId,
        exerciseId || undefined,
        exerciseName,
        PAGE_SIZE,
        pageParam,
      );
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

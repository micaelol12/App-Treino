import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/presentation/auth-context';

import { useProgressRepository } from './progress-context';

const PAGE_SIZE = 200;

export function useExerciseProgress(exerciseName: string) {
  const { session } = useAuth();
  const repository = useProgressRepository();
  const userId = session?.uid;

  return useInfiniteQuery({
    queryKey: ['exercise-progress', userId, exerciseName],
    enabled: Boolean(userId && exerciseName),
    initialPageParam: undefined as
      { readonly id: string; readonly performedOn: string } | undefined,
    queryFn: ({ pageParam }) => {
      if (!userId) throw new Error('Authenticated user required');
      return repository.listExercisePage(userId, exerciseName, PAGE_SIZE, pageParam);
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WorkoutDivisionService } from '../application/workout-division-service';
import type { WorkoutDivisionDraft } from '../domain/workout-division';
import { useAuth } from '@/features/auth/presentation/auth-context';

import { useWorkoutDivisionRepository } from './workout-division-context';

function queryKey(userId: string | undefined) {
  return ['workout-divisions', userId] as const;
}

export function useWorkoutDivisions() {
  const { session } = useAuth();
  const repository = useWorkoutDivisionRepository();
  const service = useMemo(() => new WorkoutDivisionService(repository), [repository]);
  const userId = session?.uid;
  return useQuery({
    queryKey: queryKey(userId),
    enabled: Boolean(userId),
    queryFn: () => {
      if (!userId) throw new Error('Authenticated user required');
      return service.list(userId);
    },
  });
}

export function useWorkoutDivisionActions() {
  const { session } = useAuth();
  const repository = useWorkoutDivisionRepository();
  const service = useMemo(() => new WorkoutDivisionService(repository), [repository]);
  const queryClient = useQueryClient();
  const userId = session?.uid;
  const requireUserId = () => {
    if (!userId) throw new Error('Authenticated user required');
    return userId;
  };
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: ['workout-plan', userId] }),
    ]);

  const create = useMutation({
    mutationFn: (draft: WorkoutDivisionDraft) => service.create(requireUserId(), draft),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      divisionId,
      draft,
    }: {
      readonly divisionId: string;
      readonly draft: WorkoutDivisionDraft;
    }) => service.update(requireUserId(), divisionId, draft),
    onSuccess: invalidate,
  });
  return { create, update };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WorkoutPlanService } from '../application/workout-plan-service';
import type { WorkoutExerciseDraft } from '../domain/workout-plan-rules';
import { useAuth } from '../../auth/presentation/auth-context';

import { useWorkoutPlanRepository } from './workout-plan-context';

function queryKey(userId: string | undefined) {
  return ['workout-plan', userId] as const;
}

export function useWorkoutPlanExercises() {
  const { session } = useAuth();
  const repository = useWorkoutPlanRepository();
  const service = useMemo(() => new WorkoutPlanService(repository), [repository]);
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

export function useWorkoutPlanActions() {
  const { session } = useAuth();
  const repository = useWorkoutPlanRepository();
  const service = useMemo(() => new WorkoutPlanService(repository), [repository]);
  const queryClient = useQueryClient();
  const userId = session?.uid;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKey(userId) });
  const requireUserId = () => {
    if (!userId) throw new Error('Authenticated user required');
    return userId;
  };

  const create = useMutation({
    mutationFn: (draft: WorkoutExerciseDraft) => service.create(requireUserId(), draft),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      draft,
      exerciseId,
    }: {
      readonly draft: WorkoutExerciseDraft;
      readonly exerciseId: string;
    }) => service.update(requireUserId(), exerciseId, draft),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (exerciseId: string) => service.delete(requireUserId(), exerciseId),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: ({
      direction,
      exerciseId,
    }: {
      readonly direction: 'up' | 'down';
      readonly exerciseId: string;
    }) => service.move(requireUserId(), exerciseId, direction),
    onSuccess: invalidate,
  });

  return { create, move, remove, update };
}

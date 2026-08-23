import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WorkoutPlanService } from '../application/workout-plan-service';
import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import {
  sortWorkoutExercises,
  type WorkoutExerciseInput,
} from '../domain/workout-plan-rules';
import { useAuth } from '../../auth/presentation/auth-context';

import { useWorkoutPlanRepository } from './workout-plan-context';

function queryKey(userId: string | undefined) {
  return ['workout-plan', userId] as const;
}

function applyExerciseOrder(
  exercises: readonly WorkoutPlanExercise[],
  divisionId: string,
  orderedExerciseIds: readonly string[],
): WorkoutPlanExercise[] {
  const positions = new Map(orderedExerciseIds.map((id, index) => [id, index + 1]));
  return sortWorkoutExercises(
    exercises.map((exercise) =>
      exercise.divisionId === divisionId && positions.has(exercise.id)
        ? { ...exercise, order: positions.get(exercise.id) ?? exercise.order }
        : exercise,
    ),
  );
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
    mutationFn: (draft: WorkoutExerciseInput) => service.create(requireUserId(), draft),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      draft,
      exerciseId,
    }: {
      readonly draft: WorkoutExerciseInput;
      readonly exerciseId: string;
    }) => service.update(requireUserId(), exerciseId, draft),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (exerciseId: string) => service.delete(requireUserId(), exerciseId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: ({
      divisionId,
      orderedExerciseIds,
    }: {
      readonly divisionId: string;
      readonly orderedExerciseIds: readonly string[];
    }) => service.reorder(requireUserId(), divisionId, orderedExerciseIds),
    onMutate: async ({ divisionId, orderedExerciseIds }) => {
      const key = queryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutPlanExercise[]>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          applyExerciseOrder(previous, divisionId, orderedExerciseIds),
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey(userId), context.previous);
      }
    },
    onSettled: invalidate,
  });

  return { create, remove, reorder, update };
}

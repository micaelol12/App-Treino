import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WorkoutDivisionService } from '../application/workout-division-service';
import {
  sortWorkoutDivisions,
  type WorkoutDivision,
  type WorkoutDivisionInput,
} from '../domain/workout-division';
import { useAuth } from '@/features/auth/presentation/auth-context';

import { useWorkoutDivisionRepository } from './workout-division-context';

function queryKey(userId: string | undefined) {
  return ['workout-divisions', userId] as const;
}

function applyDivisionOrder(
  divisions: readonly WorkoutDivision[],
  orderedDivisionIds: readonly string[],
): WorkoutDivision[] {
  const positions = new Map(orderedDivisionIds.map((id, index) => [id, index + 1]));
  return sortWorkoutDivisions(
    divisions.map((division) => ({
      ...division,
      order: positions.get(division.id) ?? division.order,
    })),
  );
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
    mutationFn: (draft: WorkoutDivisionInput) => service.create(requireUserId(), draft),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      divisionId,
      draft,
    }: {
      readonly divisionId: string;
      readonly draft: WorkoutDivisionInput;
    }) => service.update(requireUserId(), divisionId, draft),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (divisionId: string) => service.remove(requireUserId(), divisionId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (orderedDivisionIds: readonly string[]) =>
      service.reorder(requireUserId(), orderedDivisionIds),
    onMutate: async (orderedDivisionIds) => {
      const key = queryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutDivision[]>(key);
      if (previous) {
        queryClient.setQueryData(key, applyDivisionOrder(previous, orderedDivisionIds));
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

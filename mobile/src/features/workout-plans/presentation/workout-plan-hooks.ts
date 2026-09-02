import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import { WorkoutPlanService } from '../application/workout-plan-service';
import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import {
  sortWorkoutExercises,
  type WorkoutExerciseInput,
} from '../domain/workout-plan-rules';
import { useAuth } from '../../auth/presentation/auth-context';
import { DebouncedWriteQueue } from '@/shared/utils/debounced-write-queue';

import { useWorkoutPlanRepository } from './workout-plan-context';

function queryKey(userId: string | undefined) {
  return ['workout-plan', userId] as const;
}

type WorkoutPlanReorderRequest = {
  readonly divisionId: string;
  readonly orderedExerciseIds: readonly string[];
};

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
  const reorderSnapshots = useRef(new WeakMap<object, readonly WorkoutPlanExercise[]>());
  const reorderQueue = useRef(new DebouncedWriteQueue<WorkoutPlanReorderRequest>(700));
  const confirmedOrder = useRef<readonly WorkoutPlanExercise[] | undefined>(undefined);
  const pendingReorders = useRef<WorkoutPlanReorderRequest[]>([]);
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
  const reorderMutation = useMutation({
    mutationFn: (request: WorkoutPlanReorderRequest) =>
      reorderQueue.current.enqueue(request, (latestRequest) =>
        service.reorder(
          requireUserId(),
          latestRequest.divisionId,
          latestRequest.orderedExerciseIds,
          reorderSnapshots.current.get(latestRequest),
        ),
      ),
    onMutate: async (request) => {
      const key = queryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutPlanExercise[]>(key);
      if (previous) {
        if (!pendingReorders.current.length) confirmedOrder.current = previous;
        pendingReorders.current = [...pendingReorders.current, request];
        reorderSnapshots.current.set(request, previous);
        queryClient.setQueryData(
          key,
          applyExerciseOrder(previous, request.divisionId, request.orderedExerciseIds),
        );
      }
    },
    onSuccess: (_data, request) => {
      if (confirmedOrder.current) {
        confirmedOrder.current = applyExerciseOrder(
          confirmedOrder.current,
          request.divisionId,
          request.orderedExerciseIds,
        );
      }
      pendingReorders.current = pendingReorders.current.filter(
        (pending) => pending !== request,
      );
      if (!pendingReorders.current.length) {
        if (confirmedOrder.current) {
          queryClient.setQueryData(queryKey(userId), confirmedOrder.current);
        }
        confirmedOrder.current = undefined;
      }
    },
    onError: (_error, request) => {
      pendingReorders.current = pendingReorders.current.filter(
        (pending) => pending !== request,
      );
      let restored = confirmedOrder.current;
      for (const pending of pendingReorders.current) {
        if (!restored) break;
        restored = applyExerciseOrder(
          restored,
          pending.divisionId,
          pending.orderedExerciseIds,
        );
      }
      if (restored) queryClient.setQueryData(queryKey(userId), restored);
      if (!pendingReorders.current.length) confirmedOrder.current = undefined;
    },
  });
  const flushReorder = useCallback(() => reorderQueue.current.flush(), []);
  const reorder = { ...reorderMutation, flush: flushReorder };

  return { create, remove, reorder, update };
}

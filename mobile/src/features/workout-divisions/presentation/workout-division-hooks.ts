import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import { WorkoutDivisionService } from '../application/workout-division-service';
import {
  sortWorkoutDivisions,
  type WorkoutDivision,
  type WorkoutDivisionInput,
} from '../domain/workout-division';
import { useAuth } from '@/features/auth/presentation/auth-context';
import type { WorkoutPlanExercise } from '@/features/workout-plans/domain/workout-plan-exercise';
import { sortWorkoutExercises } from '@/features/workout-plans/domain/workout-plan-rules';
import { DebouncedWriteQueue } from '@/shared/utils/debounced-write-queue';

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

function applyDivisionOrderToExercises(
  exercises: readonly WorkoutPlanExercise[],
  orderedDivisionIds: readonly string[],
): WorkoutPlanExercise[] {
  const positions = new Map(orderedDivisionIds.map((id, index) => [id, index + 1]));
  return sortWorkoutExercises(
    exercises.map((exercise) => ({
      ...exercise,
      divisionOrder: positions.get(exercise.divisionId) ?? exercise.divisionOrder,
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
  const reorderSnapshots = useRef(
    new WeakMap<readonly string[], readonly WorkoutDivision[]>(),
  );
  const reorderQueue = useRef(new DebouncedWriteQueue<readonly string[]>(700));
  const confirmedDivisions = useRef<readonly WorkoutDivision[] | undefined>(undefined);
  const confirmedPlan = useRef<readonly WorkoutPlanExercise[] | undefined>(undefined);
  const pendingReorders = useRef<(readonly string[])[]>([]);
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
  const reorderMutation = useMutation({
    mutationFn: (orderedDivisionIds: readonly string[]) =>
      reorderQueue.current.enqueue(orderedDivisionIds, (latestDivisionIds) =>
        service.reorder(
          requireUserId(),
          latestDivisionIds,
          reorderSnapshots.current.get(latestDivisionIds),
        ),
      ),
    onMutate: async (orderedDivisionIds) => {
      const key = queryKey(userId);
      const planKey = ['workout-plan', userId] as const;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: key }),
        queryClient.cancelQueries({ queryKey: planKey }),
      ]);
      const previous = queryClient.getQueryData<WorkoutDivision[]>(key);
      const previousPlan = queryClient.getQueryData<WorkoutPlanExercise[]>(planKey);
      if (previous) {
        if (!pendingReorders.current.length) {
          confirmedDivisions.current = previous;
          confirmedPlan.current = previousPlan;
        }
        pendingReorders.current = [...pendingReorders.current, orderedDivisionIds];
        reorderSnapshots.current.set(orderedDivisionIds, previous);
        queryClient.setQueryData(key, applyDivisionOrder(previous, orderedDivisionIds));
      }
      if (previousPlan) {
        queryClient.setQueryData(
          planKey,
          applyDivisionOrderToExercises(previousPlan, orderedDivisionIds),
        );
      }
    },
    onSuccess: (_data, orderedDivisionIds) => {
      if (confirmedDivisions.current) {
        confirmedDivisions.current = applyDivisionOrder(
          confirmedDivisions.current,
          orderedDivisionIds,
        );
      }
      if (confirmedPlan.current) {
        confirmedPlan.current = applyDivisionOrderToExercises(
          confirmedPlan.current,
          orderedDivisionIds,
        );
      }
      pendingReorders.current = pendingReorders.current.filter(
        (pending) => pending !== orderedDivisionIds,
      );
      if (!pendingReorders.current.length) {
        if (confirmedDivisions.current) {
          queryClient.setQueryData(queryKey(userId), confirmedDivisions.current);
        }
        if (confirmedPlan.current) {
          queryClient.setQueryData(['workout-plan', userId], confirmedPlan.current);
        }
        confirmedDivisions.current = undefined;
        confirmedPlan.current = undefined;
      }
    },
    onError: (_error, orderedDivisionIds) => {
      pendingReorders.current = pendingReorders.current.filter(
        (pending) => pending !== orderedDivisionIds,
      );
      let restoredDivisions = confirmedDivisions.current;
      let restoredPlan = confirmedPlan.current;
      for (const pending of pendingReorders.current) {
        if (restoredDivisions) {
          restoredDivisions = applyDivisionOrder(restoredDivisions, pending);
        }
        if (restoredPlan) {
          restoredPlan = applyDivisionOrderToExercises(restoredPlan, pending);
        }
      }
      if (restoredDivisions) {
        queryClient.setQueryData(queryKey(userId), restoredDivisions);
      }
      if (restoredPlan) {
        queryClient.setQueryData(['workout-plan', userId], restoredPlan);
      }
      if (!pendingReorders.current.length) {
        confirmedDivisions.current = undefined;
        confirmedPlan.current = undefined;
      }
    },
  });
  const flushReorder = useCallback(() => reorderQueue.current.flush(), []);
  const reorder = { ...reorderMutation, flush: flushReorder };
  return { create, remove, reorder, update };
}

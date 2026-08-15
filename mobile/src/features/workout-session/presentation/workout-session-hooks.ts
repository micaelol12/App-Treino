import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

import { CompleteWorkoutSession } from '../application/complete-workout-session';
import type { WorkoutSessionDraft } from '../domain/workout-session-draft';
import { useAuth } from '../../auth/presentation/auth-context';

import { useWorkoutSessionRepository } from './workout-session-context';

export function useCompleteWorkoutSession() {
  const { session } = useAuth();
  const repository = useWorkoutSessionRepository();
  const useCase = useMemo(() => new CompleteWorkoutSession(repository), [repository]);

  return useMutation({
    mutationFn: (draft: WorkoutSessionDraft) => {
      if (!session) throw new Error('Authenticated user required');
      return useCase.execute(session.uid, draft);
    },
  });
}

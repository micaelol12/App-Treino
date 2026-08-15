import type { WorkoutSessionDraft } from '../domain/workout-session-draft';
import { prepareWorkoutSessionCompletion } from '../domain/workout-session-rules';

import type { WorkoutSessionRepository } from './workout-session-repository';

export class CompleteWorkoutSession {
  constructor(private readonly repository: WorkoutSessionRepository) {}

  async execute(userId: string, draft: WorkoutSessionDraft): Promise<number> {
    if (draft.userId !== userId) {
      throw new Error('Workout draft does not belong to the authenticated user');
    }

    const completedSession = prepareWorkoutSessionCompletion(draft);
    await this.repository.complete(userId, completedSession);
    return completedSession.sets.length;
  }
}

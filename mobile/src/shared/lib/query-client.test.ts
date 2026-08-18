import { WorkoutPlanFailure } from '@/features/workout-plans/application/workout-plan-failure';

import { shouldRetryRemoteQuery } from './query-client';

describe('query retry policy', () => {
  it('tenta novamente falhas transitórias no máximo duas vezes', () => {
    expect(shouldRetryRemoteQuery(0, new WorkoutPlanFailure('network'))).toBe(true);
    expect(shouldRetryRemoteQuery(1, new WorkoutPlanFailure('network'))).toBe(true);
    expect(shouldRetryRemoteQuery(2, new WorkoutPlanFailure('network'))).toBe(false);
  });

  it.each(['configuration', 'invalid-data', 'permission-denied'] as const)(
    'não repete uma falha permanente: %s',
    (code) => {
      expect(shouldRetryRemoteQuery(0, new WorkoutPlanFailure(code))).toBe(false);
    },
  );
});

import { createWorkoutSessionId } from './create-workout-session-id';
import { WorkoutSessionFailure } from './workout-session-failure';

describe('createWorkoutSessionId', () => {
  it('creates a Firestore-safe deterministic value from injected entropy', () => {
    expect(createWorkoutSessionId(1_700_000_000_000, 0.5)).toMatch(
      /^session-[a-z0-9]+-[a-z0-9]+$/,
    );
    expect(createWorkoutSessionId(1, 0)).toBe('session-1-0');
  });

  it('uses clock and random defaults when no entropy is injected', () => {
    expect(createWorkoutSessionId()).toMatch(/^session-[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe('WorkoutSessionFailure', () => {
  it('keeps a known failure code and optional cause', () => {
    const cause = new Error('offline');
    const failure = new WorkoutSessionFailure('network', { cause });

    expect(failure).toMatchObject({
      name: 'WorkoutSessionFailure',
      message: 'network',
      code: 'network',
      cause,
    });

    expect(new WorkoutSessionFailure('unknown').cause).toBeUndefined();
  });
});

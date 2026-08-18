export function createWorkoutSessionId(
  now: number = Date.now(),
  random: number = Math.random(),
): string {
  const randomPart = Math.floor(random * Number.MAX_SAFE_INTEGER).toString(36);
  return `session-${now.toString(36)}-${randomPart}`;
}

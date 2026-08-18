export interface WorkoutDivision {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly active: boolean;
  readonly sourceSchemaVersion: 2;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface WorkoutDivisionDraft {
  readonly name: string;
  readonly order: number;
  readonly active: boolean;
}

export type WorkoutDivisionRuleCode = 'name-required' | 'name-too-long' | 'invalid-order';

export class WorkoutDivisionRuleError extends Error {
  constructor(readonly code: WorkoutDivisionRuleCode) {
    super(code);
    this.name = 'WorkoutDivisionRuleError';
  }
}

export function normalizeDivisionName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function comparableDivisionName(value: string): string {
  return normalizeDivisionName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function validateWorkoutDivisionDraft(
  draft: WorkoutDivisionDraft,
): WorkoutDivisionDraft {
  const name = normalizeDivisionName(draft.name);
  if (!name) throw new WorkoutDivisionRuleError('name-required');
  if (name.length > 80) throw new WorkoutDivisionRuleError('name-too-long');
  if (!Number.isInteger(draft.order) || draft.order < 1 || draft.order > 999) {
    throw new WorkoutDivisionRuleError('invalid-order');
  }
  return { ...draft, name };
}

export function sortWorkoutDivisions(
  divisions: readonly WorkoutDivision[],
): WorkoutDivision[] {
  return [...divisions].sort(
    (left, right) =>
      left.order - right.order ||
      left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }) ||
      left.id.localeCompare(right.id),
  );
}

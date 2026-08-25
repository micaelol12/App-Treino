export interface WorkoutDivision {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly active: boolean;
  readonly sourceSchemaVersion: 2;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly sourceTemplateId?: string;
  readonly sourceTemplateVersion?: number;
  readonly importedAt?: Date;
}

export interface WorkoutDivisionInput {
  readonly name: string;
  readonly active: boolean;
}

export interface WorkoutDivisionDraft extends WorkoutDivisionInput {
  readonly order: number;
}

export interface DivisionOrderUpdate {
  readonly id: string;
  readonly order: number;
}

export type WorkoutDivisionRuleCode =
  'name-required' | 'name-too-long' | 'invalid-order' | 'invalid-sequence';

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
  const input = validateWorkoutDivisionInput(draft);
  if (!Number.isInteger(draft.order) || draft.order < 1 || draft.order > 999) {
    throw new WorkoutDivisionRuleError('invalid-order');
  }
  return { ...input, order: draft.order };
}

export function validateWorkoutDivisionInput(
  input: WorkoutDivisionInput,
): WorkoutDivisionInput {
  const name = normalizeDivisionName(input.name);
  if (!name) throw new WorkoutDivisionRuleError('name-required');
  if (name.length > 80) throw new WorkoutDivisionRuleError('name-too-long');
  return { ...input, name };
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

export function reorderWorkoutDivisions(
  divisions: readonly WorkoutDivision[],
  orderedDivisionIds: readonly string[],
): DivisionOrderUpdate[] {
  const currentIds = new Set(divisions.map(({ id }) => id));
  const orderedIds = new Set(orderedDivisionIds);
  if (
    orderedDivisionIds.length !== divisions.length ||
    orderedIds.size !== orderedDivisionIds.length ||
    currentIds.size !== orderedIds.size ||
    [...currentIds].some((id) => !orderedIds.has(id))
  ) {
    throw new WorkoutDivisionRuleError('invalid-sequence');
  }

  const byId = new Map(divisions.map((division) => [division.id, division]));
  return orderedDivisionIds
    .map((id, index) => ({ id, order: index + 1 }))
    .filter(({ id, order }) => byId.get(id)?.order !== order);
}

import { isCivilDate } from '../../../shared/validation/civil-date';

import type { WeightEntry } from './weight-entry';

export interface WeightEntryDraft {
  readonly recordedOn: string;
  readonly weightKg: number;
}

export interface WeightTrendPoint extends WeightEntry {
  readonly sevenEntryAverageKg: number;
}

export type WeightRuleErrorCode = 'date' | 'weight';

export class WeightRuleError extends Error {
  constructor(readonly code: WeightRuleErrorCode) {
    super(code);
    this.name = 'WeightRuleError';
  }
}

export function validateWeightEntryDraft(draft: WeightEntryDraft): WeightEntryDraft {
  if (!isCivilDate(draft.recordedOn)) throw new WeightRuleError('date');
  if (!Number.isFinite(draft.weightKg) || draft.weightKg < 30 || draft.weightKg > 500) {
    throw new WeightRuleError('weight');
  }

  return { recordedOn: draft.recordedOn, weightKg: draft.weightKg };
}

function isPreferredEntry(candidate: WeightEntry, current: WeightEntry): boolean {
  const candidateTime = candidate.updatedAt?.getTime();
  const currentTime = current.updatedAt?.getTime();

  if (candidateTime !== undefined || currentTime !== undefined) {
    return (
      (candidateTime ?? Number.NEGATIVE_INFINITY) >
      (currentTime ?? Number.NEGATIVE_INFINITY)
    );
  }

  return candidate.id.localeCompare(current.id) > 0;
}

export function normalizeWeightEntries(entries: readonly WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, WeightEntry>();

  for (const entry of entries) {
    const current = byDate.get(entry.recordedOn);
    if (!current || isPreferredEntry(entry, current)) byDate.set(entry.recordedOn, entry);
  }

  return [...byDate.values()].sort((left, right) =>
    left.recordedOn.localeCompare(right.recordedOn),
  );
}

export function calculateWeightTrend(
  entries: readonly WeightEntry[],
): WeightTrendPoint[] {
  const normalized = normalizeWeightEntries(entries);

  return normalized.map((entry, index) => {
    const window = normalized.slice(Math.max(0, index - 6), index + 1);
    const average = window.reduce((sum, item) => sum + item.weightKg, 0) / window.length;
    return { ...entry, sevenEntryAverageKg: average };
  });
}

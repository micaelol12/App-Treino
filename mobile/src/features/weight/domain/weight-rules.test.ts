import type { WeightEntry } from './weight-entry';
import {
  calculateWeightTrend,
  normalizeWeightEntries,
  validateWeightEntryDraft,
  WeightRuleError,
} from './weight-rules';

const entry = (id: string, recordedOn: string, weightKg: number): WeightEntry => ({
  id,
  recordedOn,
  weightKg,
  sourceSchemaVersion: 0,
});

describe('weight rules', () => {
  it('validates the supported date and weight range', () => {
    expect(
      validateWeightEntryDraft({ recordedOn: '2026-07-01', weightKg: 79.6 }),
    ).toEqual({
      recordedOn: '2026-07-01',
      weightKg: 79.6,
    });
    expect(() =>
      validateWeightEntryDraft({ recordedOn: '2026-02-30', weightKg: 79.6 }),
    ).toThrow(new WeightRuleError('date'));
    expect(() =>
      validateWeightEntryDraft({ recordedOn: '2026-07-01', weightKg: 29.9 }),
    ).toThrow(new WeightRuleError('weight'));
  });

  it('normalizes duplicate dates deterministically', () => {
    const entries = [
      entry('weight_07', '2026-07-07', 79.3),
      entry('legacy_duplicate_07_old', '2026-07-07', 79.2),
      entry('weight_01', '2026-07-01', 80),
    ];

    expect(normalizeWeightEntries(entries).map(({ id }) => id)).toEqual([
      'weight_01',
      'weight_07',
    ]);
  });

  it('prefers the most recently updated duplicate', () => {
    const old = { ...entry('z', '2026-07-07', 79.2), updatedAt: new Date('2026-07-07') };
    const recent = {
      ...entry('a', '2026-07-07', 79.4),
      updatedAt: new Date('2026-07-08'),
    };

    expect(normalizeWeightEntries([old, recent])).toEqual([recent]);
  });

  it('calculates a moving average over seven records, not calendar days', () => {
    const entries = Array.from({ length: 8 }, (_, index) =>
      entry(
        `weight_${index}`,
        `2026-07-${String(index + 1).padStart(2, '0')}`,
        80 - index,
      ),
    );
    const trend = calculateWeightTrend(entries);

    expect(trend[0]?.sevenEntryAverageKg).toBe(80);
    expect(trend[6]?.sevenEntryAverageKg).toBe(77);
    expect(trend[7]?.sevenEntryAverageKg).toBe(76);
  });
});

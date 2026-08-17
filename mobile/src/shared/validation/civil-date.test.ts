import {
  civilDateToDate,
  currentCivilDate,
  dateToCivilDate,
  formatCivilDate,
  isCivilDate,
} from './civil-date';

describe('isCivilDate', () => {
  it.each(['2026-01-01', '2024-02-29', '2000-12-31'])(
    'accepts the real civil date %s',
    (value) => {
      expect(isCivilDate(value)).toBe(true);
    },
  );

  it.each([
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '14/08/2026',
    '2026-8-14',
  ])('rejects the invalid civil date %s', (value) => {
    expect(isCivilDate(value)).toBe(false);
  });
});

describe('civil date conversions', () => {
  it('converts without UTC timezone shifts and formats for display', () => {
    const date = civilDateToDate('2026-08-14');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 7, 14]);
    expect(dateToCivilDate(date)).toBe('2026-08-14');
    expect(formatCivilDate('2026-08-14')).toBe('14/08/2026');
    expect(formatCivilDate('invalid')).toBe('invalid');
  });

  it('uses today when conversion receives an invalid value', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 17, 9));
    expect(dateToCivilDate(civilDateToDate('invalid'))).toBe('2026-08-17');
    expect(currentCivilDate()).toBe('2026-08-17');
    jest.useRealTimers();
  });
});

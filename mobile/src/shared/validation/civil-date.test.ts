import { isCivilDate } from './civil-date';

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

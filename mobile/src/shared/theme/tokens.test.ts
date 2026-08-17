import { themes } from './tokens';

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  return (
    channel(Number.parseInt(value.slice(0, 2), 16)) * 0.2126 +
    channel(Number.parseInt(value.slice(2, 4), 16)) * 0.7152 +
    channel(Number.parseInt(value.slice(4, 6), 16)) * 0.0722
  );
}

function contrast(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe.each(Object.entries(themes))('%s theme contrast', (_name, theme) => {
  it.each([
    ['text', 'background'],
    ['textMuted', 'background'],
    ['text', 'surface'],
    ['textMuted', 'surface'],
    ['onPrimary', 'primary'],
    ['danger', 'surface'],
    ['success', 'surface'],
    ['warningText', 'warningSurface'],
  ] as const)('keeps %s on %s at WCAG AA contrast', (foreground, background) => {
    expect(
      contrast(theme.colors[foreground], theme.colors[background]),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

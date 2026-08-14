import { type ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

type AppTextProps = ComponentProps<typeof Text> & {
  variant?: 'body' | 'title' | 'heading' | 'caption';
};

export function AppText({ style, variant = 'body', ...props }: AppTextProps) {
  const theme = useAppTheme();

  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], { color: theme.colors.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 16, lineHeight: 24 },
  body: { fontWeight: '400' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
});

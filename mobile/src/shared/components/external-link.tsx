import { Linking, Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type ExternalLinkProps = {
  readonly label: string;
  readonly url: string;
};

export function ExternalLink({ label, url }: ExternalLinkProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityHint="Abre no navegador"
      accessibilityLabel={label}
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => [
        styles.link,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
          borderColor: theme.colors.primary,
        },
      ]}
    >
      <AppText style={{ color: theme.colors.primary, fontWeight: '700' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});

import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

type AuthLinkProps = {
  readonly href: Href;
  readonly label: string;
  readonly testID?: string;
};

export function AuthLink({ href, label, testID }: AuthLinkProps) {
  const theme = useAppTheme();

  return (
    <Link asChild href={href}>
      <Pressable accessibilityRole="link" hitSlop={spacing.sm} testID={testID}>
        <AppText style={[styles.label, { color: theme.colors.primary }]}>{label}</AppText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({ label: { fontWeight: '700', textAlign: 'center' } });

import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';
import { Card } from './card';

type EmptyStateProps = { title: string; description: string };

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <Card>
      <View accessibilityRole="summary" style={styles.content}>
        <AppText variant="heading">{title}</AppText>
        <AppText>{description}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xs } });

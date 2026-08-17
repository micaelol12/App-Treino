import { type PropsWithChildren, type ReactNode, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type ScreenProps = PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
}>;

export function Screen({ action, children, description, title }: ScreenProps) {
  const theme = useAppTheme();
  const titleRef = useRef<Text>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 100);
    return () => clearTimeout(timeout);
  }, [title]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText accessibilityRole="header" ref={titleRef} variant="title">
              {title}
            </AppText>
            {description ? (
              <AppText style={{ color: theme.colors.textMuted }}>{description}</AppText>
            ) : null}
          </View>
          {action}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
});

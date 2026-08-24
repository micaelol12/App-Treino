import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type ScreenProps = PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  onRefresh?: () => void | Promise<unknown>;
  refreshing?: boolean;
  scrollToTopSignal?: string | number | null;
  nestedScroll?: boolean;
}>;

const ScreenScrollHandlerContext = createContext<RefObject<ScrollView | null> | null>(
  null,
);

export function useScreenScrollHandler() {
  return useContext(ScreenScrollHandlerContext);
}

export function Screen({
  action,
  children,
  description,
  footer,
  onRefresh,
  nestedScroll = false,
  refreshing = false,
  scrollToTopSignal,
  title,
}: ScreenProps) {
  const theme = useAppTheme();
  const titleRef = useRef<Text>(null);
  const scrollRef = useRef<ScrollView>(null);
  const ScrollComponent = nestedScroll ? NestableScrollContainer : ScrollView;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 100);
    return () => clearTimeout(timeout);
  }, [title]);

  useEffect(() => {
    if (scrollToTopSignal !== undefined && scrollToTopSignal !== null) {
      scrollRef.current?.scrollTo({ animated: true, y: 0 });
    }
  }, [scrollToTopSignal]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollComponent
          alwaysBounceVertical={Boolean(onRefresh)}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={nestedScroll}
          ref={scrollRef as never}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                accessibilityLabel="Atualizar conteúdo"
                colors={[theme.colors.primary]}
                onRefresh={() => void onRefresh()}
                progressBackgroundColor={theme.colors.surface}
                refreshing={refreshing}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          style={styles.scroll}
          testID="screen-scroll-view"
        >
          <ScreenScrollHandlerContext.Provider value={nestedScroll ? scrollRef : null}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <AppText accessibilityRole="header" ref={titleRef} variant="title">
                  {title}
                </AppText>
                {description ? (
                  <AppText style={{ color: theme.colors.textMuted }}>
                    {description}
                  </AppText>
                ) : null}
              </View>
              {action}
            </View>
            {children}
          </ScreenScrollHandlerContext.Provider>
        </ScrollComponent>
        {footer ? (
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  footer: { padding: spacing.md, borderTopWidth: 1 },
});

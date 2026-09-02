import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

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
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const [footerHeight, setFooterHeight] = useState(0);

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
      <KeyboardAwareScrollView
        {...(nestedScroll
          ? { ScrollViewComponent: NestableScrollContainer as never }
          : {})}
        alwaysBounceVertical={Boolean(onRefresh)}
        bottomOffset={footerHeight - spacing.md}
        contentContainerStyle={styles.content}
        extraKeyboardSpace={spacing.sm}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        mode="insets"
        nestedScrollEnabled={nestedScroll}
        ref={scrollRef}
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
        <ScreenScrollHandlerContext.Provider
          value={nestedScroll ? (scrollRef as RefObject<ScrollView | null>) : null}
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
        </ScreenScrollHandlerContext.Provider>
      </KeyboardAwareScrollView>
      {footer ? (
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  footer: { padding: spacing.md, borderTopWidth: 1 },
});

import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

export function NetworkLifecycle() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const isOnline = Boolean(
          state.isConnected && state.isInternetReachable !== false,
        );
        onlineManager.setOnline(isOnline);
        setIsOffline(!isOnline);
      }),
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
      if (state === 'active') void NetInfo.refresh();
    });
    return () => subscription.remove();
  }, []);

  if (!isOffline) return null;

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      pointerEvents="none"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningSurface,
          borderColor: theme.colors.warning,
          top: insets.top + spacing.xs,
        },
      ]}
      testID="offline-banner"
    >
      <AppText style={{ color: theme.colors.warningText, fontWeight: '700' }}>
        Sem conexão. Seus dados locais serão mantidos; tente novamente ao reconectar.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    zIndex: 100,
    left: spacing.md,
    right: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});

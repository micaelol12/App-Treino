import { Pressable, StyleSheet, type AccessibilityActionEvent } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type DragHandleProps = {
  disabled?: boolean;
  drag: () => void;
  itemName: string;
  position: number;
  total: number;
  onMove: (direction: 'before' | 'after') => void;
};

export function DragHandle({
  disabled = false,
  drag,
  itemName,
  onMove,
  position,
  total,
}: DragHandleProps) {
  const theme = useAppTheme();
  const accessibilityActions = disabled
    ? []
    : [
        ...(position > 1 ? [{ name: 'moveBefore', label: 'Mover antes' }] : []),
        ...(position < total ? [{ name: 'moveAfter', label: 'Mover depois' }] : []),
      ];

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled) return;
    if (event.nativeEvent.actionName === 'moveBefore') onMove('before');
    if (event.nativeEvent.actionName === 'moveAfter') onMove('after');
  };

  return (
    <Pressable
      accessibilityActions={accessibilityActions}
      accessibilityHint="Pressione e segure para arrastar."
      accessibilityLabel={`Arrastar ${itemName}, posição ${position} de ${total}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      delayLongPress={200}
      disabled={disabled}
      onAccessibilityAction={handleAccessibilityAction}
      onLongPress={drag}
      style={({ pressed }) => [
        styles.handle,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        ≡
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    marginRight: spacing.xxs,
  },
  icon: { fontSize: 28, fontWeight: '700', lineHeight: 30 },
});

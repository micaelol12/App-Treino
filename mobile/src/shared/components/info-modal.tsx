import Ionicons from '@expo/vector-icons/Ionicons';
import { type PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type InfoModalProps = PropsWithChildren<{
  readonly visible: boolean;
  readonly title: string;
  readonly onClose: () => void;
}>;

export function InfoModal({ children, onClose, title, visible }: InfoModalProps) {
  const theme = useAppTheme();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <AppText accessibilityRole="header" variant="heading">
              {title}
            </AppText>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.close}
            >
              <Ionicons color={theme.colors.text} name="close" size={26} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  sheet: {
    maxHeight: '88%',
    minHeight: 240,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  content: { gap: spacing.md, padding: spacing.md },
});

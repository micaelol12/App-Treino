import { StyleSheet } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

type AuthFeedbackProps = {
  readonly message: string;
  readonly tone?: 'danger' | 'success';
};

export function AuthFeedback({ message, tone = 'danger' }: AuthFeedbackProps) {
  const theme = useAppTheme();

  return (
    <AppText
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      style={[
        styles.feedback,
        { color: tone === 'danger' ? theme.colors.danger : theme.colors.success },
      ]}
    >
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({ feedback: { marginVertical: spacing.xs } });

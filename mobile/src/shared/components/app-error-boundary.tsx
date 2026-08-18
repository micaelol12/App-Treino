import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reportError } from '@/shared/telemetry/error-reporter';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo): void {
    reportError('unhandled_render_error', error);
  }

  private readonly reset = () => this.setState({ error: null });

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo não saiu como esperado</Text>
        <Text style={styles.body}>
          Tente novamente. Se o erro persistir, reinicie o app.
        </Text>
        <Pressable
          accessibilityLabel="Tentar carregar o aplicativo novamente"
          accessibilityRole="button"
          onPress={this.reset}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#101116',
  },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  body: { color: '#D0D5DD', fontSize: 16 },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#5B5FEF',
  },
  buttonLabel: { color: '#FFFFFF', textAlign: 'center', fontWeight: '700' },
});

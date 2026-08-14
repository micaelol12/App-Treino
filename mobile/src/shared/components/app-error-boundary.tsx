import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro não tratado na aplicação.', error, info.componentStack);
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
        <TouchableOpacity
          accessibilityRole="button"
          onPress={this.reset}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Tentar novamente</Text>
        </TouchableOpacity>
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
  button: { marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: '#5B5FEF' },
  buttonLabel: { color: '#FFFFFF', textAlign: 'center', fontWeight: '700' },
});

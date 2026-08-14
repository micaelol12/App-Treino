import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Card } from '@/shared/components/card';
import { Screen } from '@/shared/components/screen';
import { useAppTheme } from '@/shared/theme/theme-provider';

export default function NotFoundRoute() {
  const theme = useAppTheme();

  return (
    <Screen
      title="Página não encontrada"
      description="Este endereço não existe no aplicativo."
    >
      <Card>
        <Link href="/treino" style={[styles.link, { color: theme.colors.primary }]}>
          Voltar para o treino
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ link: { fontSize: 16, fontWeight: '700' } });

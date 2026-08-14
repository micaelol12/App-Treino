import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';

export default function WorkoutRoute() {
  return (
    <Screen title="Seu treino" description="Plano atual e próxima sessão.">
      <Card>
        <AppText variant="heading">Nenhum treino em andamento</AppText>
        <AppText>
          Quando seu plano estiver conectado, o próximo treino aparecerá aqui.
        </AppText>
        <Link href="/treino/ativo" asChild style={styles.action}>
          <PrimaryButton label="Abrir sessão de exemplo" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ action: { marginTop: 8 } });

import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { WorkoutDivision } from '../../domain/workout-division';
import { WorkoutDivisionFailure } from '../../application/workout-division-failure';
import { WorkoutDivisionRuleError } from '../../domain/workout-division';
import { WorkoutFormField } from '@/features/workout-plans/presentation/components/workout-form-field';
import { WorkoutPlanAction } from '@/features/workout-plans/presentation/components/workout-plan-action';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import {
  useWorkoutDivisionActions,
  useWorkoutDivisions,
} from '../workout-division-hooks';

function errorMessage(error: unknown): string {
  if (error instanceof WorkoutDivisionRuleError) {
    return {
      'name-required': 'Informe o nome da divisão.',
      'name-too-long': 'O nome deve ter no máximo 80 caracteres.',
      'invalid-order': 'A ordem deve ser um inteiro entre 1 e 999.',
    }[error.code];
  }
  if (error instanceof WorkoutDivisionFailure) {
    return {
      duplicate: 'Já existe uma divisão com esse nome.',
      'duplicate-order': 'Essa ordem já está sendo usada.',
      'not-found': 'A divisão não existe mais.',
      'permission-denied': 'Sua sessão não permite alterar divisões.',
      network: 'Não foi possível acessar as divisões. Verifique sua conexão.',
      'invalid-data': 'Existe uma divisão incompatível com esta versão do app.',
      configuration: 'O Firestore ainda não foi configurado neste ambiente.',
      unknown: 'Não foi possível salvar a divisão.',
    }[error.code];
  }
  return 'Não foi possível salvar a divisão.';
}

export function WorkoutDivisionsSection() {
  const theme = useAppTheme();
  const divisions = useWorkoutDivisions();
  const { create, update } = useWorkoutDivisionActions();
  const [editing, setEditing] = useState<WorkoutDivision | null>(null);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  const reset = () => {
    setEditing(null);
    setName('');
    setOrder('');
  };

  const beginEdit = (division: WorkoutDivision) => {
    setEditing(division);
    setName(division.name);
    setOrder(String(division.order));
    setFeedback(null);
  };

  const save = async () => {
    setFeedback(null);
    const numericOrder = order.trim()
      ? Number(order)
      : Math.max(0, ...(divisions.data ?? []).map((division) => division.order)) + 1;
    try {
      if (editing) {
        await update.mutateAsync({
          divisionId: editing.id,
          draft: { name, order: numericOrder, active: editing.active },
        });
      } else {
        await create.mutateAsync({ name, order: numericOrder, active: true });
      }
      reset();
      setFeedback(editing ? 'Divisão atualizada.' : 'Divisão cadastrada.');
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  };

  const toggleActive = (division: WorkoutDivision) => {
    const nextActive = !division.active;
    const execute = () => {
      setFeedback(null);
      void update
        .mutateAsync({
          divisionId: division.id,
          draft: {
            name: division.name,
            order: division.order,
            active: nextActive,
          },
        })
        .then(() =>
          setFeedback(nextActive ? 'Divisão reativada.' : 'Divisão desativada.'),
        )
        .catch((error: unknown) => setFeedback(errorMessage(error)));
    };

    if (nextActive) execute();
    else {
      Alert.alert(
        'Desativar divisão?',
        'Ela deixará de aparecer em novos treinos, mas o histórico será preservado.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desativar', style: 'destructive', onPress: execute },
        ],
      );
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="heading">Divisões</AppText>
        <AppText style={{ color: theme.colors.textMuted }}>
          Cadastre e ordene as divisões antes de adicionar exercícios.
        </AppText>
      </View>
      <Card>
        <WorkoutFormField
          autoCapitalize="words"
          label="Nome da divisão"
          onChangeText={setName}
          placeholder="Ex.: Push A"
          testID="division-name-input"
          value={name}
        />
        <WorkoutFormField
          keyboardType="number-pad"
          label="Ordem"
          onChangeText={setOrder}
          placeholder={
            editing ? String(editing.order) : String((divisions.data?.length ?? 0) + 1)
          }
          testID="division-order-input"
          value={order}
        />
        <PrimaryButton
          disabled={pending}
          label={editing ? 'Salvar divisão' : 'Cadastrar divisão'}
          onPress={() => void save()}
          testID="division-save-button"
        />
        {editing ? <WorkoutPlanAction label="Cancelar edição" onPress={reset} /> : null}
      </Card>

      {feedback ? <AppText accessibilityLiveRegion="polite">{feedback}</AppText> : null}
      {divisions.isLoading ? <AppText>Carregando divisões…</AppText> : null}
      {divisions.isError ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {errorMessage(divisions.error)}
        </AppText>
      ) : null}
      {divisions.data?.map((division) => (
        <Card key={division.id}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <AppText style={styles.name}>{division.name}</AppText>
              <AppText style={{ color: theme.colors.textMuted }}>
                Ordem {division.order} · {division.active ? 'ativa' : 'inativa'}
              </AppText>
            </View>
            <WorkoutPlanAction
              disabled={pending}
              label="Editar"
              onPress={() => beginEdit(division)}
            />
            <WorkoutPlanAction
              disabled={pending}
              label={division.active ? 'Desativar' : 'Reativar'}
              onPress={() => toggleActive(division)}
              tone={division.active ? 'danger' : 'default'}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  heading: { gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  copy: { flex: 1, minWidth: 140, gap: spacing.xxs },
  name: { fontWeight: '700' },
});

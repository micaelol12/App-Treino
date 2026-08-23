import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  NestableDraggableFlatList,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import type { WorkoutDivision } from '../../domain/workout-division';
import { WorkoutDivisionFailure } from '../../application/workout-division-failure';
import { WorkoutDivisionRuleError } from '../../domain/workout-division';
import { WorkoutFormField } from '@/features/workout-plans/presentation/components/workout-form-field';
import { WorkoutPlanAction } from '@/features/workout-plans/presentation/components/workout-plan-action';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { DragHandle } from '@/shared/components/drag-handle';
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
      'invalid-sequence':
        'A lista mudou enquanto você ordenava. Atualize e tente novamente.',
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
  const router = useRouter();
  const theme = useAppTheme();
  const divisions = useWorkoutDivisions();
  const { create, reorder, update } = useWorkoutDivisionActions();
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const pending = create.isPending || reorder.isPending || update.isPending;
  const items = divisions.data ?? [];

  const reset = () => {
    setName('');
  };

  const beginEdit = (division: WorkoutDivision) => {
    router.push({
      pathname: '/configuracoes/divisao/[divisionId]',
      params: { divisionId: division.id },
    });
  };

  const save = async () => {
    setFeedback(null);
    try {
      await create.mutateAsync({ name, active: true });
      reset();
      setFeedback('Divisão cadastrada.');
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

  const persistOrder = async (orderedItems: readonly WorkoutDivision[]) => {
    const orderedIds = orderedItems.map(({ id }) => id);
    if (orderedIds.every((id, index) => id === items[index]?.id)) return;
    setFeedback(null);
    try {
      await reorder.mutateAsync(orderedIds);
      setFeedback('Ordem atualizada.');
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  };

  const moveByAccessibility = (index: number, direction: 'before' | 'after') => {
    const target = direction === 'before' ? index - 1 : index + 1;
    if (pending || target < 0 || target >= items.length) return;
    const next = [...items];
    const current = next[index];
    const adjacent = next[target];
    if (!current || !adjacent) return;
    next[index] = adjacent;
    next[target] = current;
    void persistOrder(next);
  };

  const renderDivision = ({
    drag,
    getIndex,
    isActive,
    item: division,
  }: RenderItemParams<WorkoutDivision>) => {
    const index = getIndex() ?? items.findIndex(({ id }) => id === division.id);
    return (
      <View
        style={[
          styles.draggableCard,
          isActive && {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surfaceMuted,
            elevation: 8,
            opacity: 0.9,
            transform: [{ scale: 1.01 }],
          },
        ]}
      >
        <Card>
          <View style={styles.row}>
            <DragHandle
              disabled={pending}
              drag={drag}
              itemName={`divisão ${division.name}`}
              onMove={(direction) => moveByAccessibility(index, direction)}
              position={index + 1}
              total={items.length}
            />
            <View style={styles.copy}>
              <AppText style={styles.name}>{division.name}</AppText>
              <AppText style={{ color: theme.colors.textMuted }}>
                {division.active ? 'Ativa' : 'Inativa'}
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
      </View>
    );
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
        <PrimaryButton
          disabled={pending}
          label="Cadastrar divisão"
          onPress={() => void save()}
          testID="division-save-button"
        />
      </Card>

      {feedback ? <AppText accessibilityLiveRegion="polite">{feedback}</AppText> : null}
      {divisions.isLoading ? <AppText>Carregando divisões…</AppText> : null}
      {divisions.isError ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {errorMessage(divisions.error)}
        </AppText>
      ) : null}
      {items.length ? (
        <NestableDraggableFlatList
          activationDistance={8}
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={({ id }) => id}
          onDragEnd={({ data }) => void persistOrder(data)}
          renderItem={renderDivision}
          testID="workout-divisions-draggable-list"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  heading: { gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  copy: { flex: 1, minWidth: 140, gap: spacing.xxs },
  name: { fontWeight: '700' },
  list: { gap: spacing.sm },
  draggableCard: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
});

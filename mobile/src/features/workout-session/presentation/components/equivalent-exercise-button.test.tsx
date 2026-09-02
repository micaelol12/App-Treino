import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Alert } from 'react-native';

import type { ExerciseCatalogSnapshot } from '@/features/exercise-catalog/application/exercise-catalog-repository';
import type { Exercise } from '@/features/exercise-catalog/domain/exercise';
import { useExerciseCatalogSnapshot } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import type { WorkoutExerciseDraft } from '@/features/workout-session/domain/workout-session-draft';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { EquivalentExerciseButton } from './equivalent-exercise-button';

jest.mock('@/features/exercise-catalog/presentation/exercise-catalog-hooks', () => ({
  useExerciseCatalogSnapshot: jest.fn(),
}));

const mockUseCatalog = jest.mocked(useExerciseCatalogSnapshot);

function catalogExercise(
  documentId: string,
  name: string,
  secondaryMuscles: readonly string[],
): Exercise {
  return {
    documentId,
    id: `${documentId}-id`,
    name,
    force: 'empurrar',
    level: 'iniciante',
    mechanic: 'composto',
    equipment: 'maquina',
    primaryMuscles: ['peito'],
    secondaryMuscles,
    instructions: [],
    category: 'peito',
    images: [],
    active: true,
  };
}

const source = catalogExercise('bench-document', 'Supino', ['triceps', 'ombros']);
const alreadyUsed = catalogExercise('fly-document', 'Crucifixo', ['ombros']);
const replacement = catalogExercise('machine-document', 'Supino máquina', [
  'triceps',
  'ombros',
]);

const snapshot: ExerciseCatalogSnapshot = {
  exercises: [source, alreadyUsed, replacement],
  taxonomies: {
    equipamentos: [{ id: 'maquina', name: 'Máquina', active: true, order: 1 }],
    categorias: [],
    forcas: [],
    niveis: [],
    mecanicas: [],
    musculos: [
      { id: 'peito', name: 'Peito', active: true, order: 1 },
      { id: 'triceps', name: 'Tríceps', active: true, order: 2 },
      { id: 'ombros', name: 'Ombros', active: true, order: 3 },
    ],
  },
  syncedAt: '2026-09-02T12:00:00.000Z',
};

const currentExercise: WorkoutExerciseDraft = {
  planExerciseId: 'plan-bench',
  exerciseId: source.id,
  exerciseDocumentId: source.documentId,
  name: source.name,
  sets: [{ setNumber: 1, loadKg: '0', repetitions: '0', rpe: '8', note: '' }],
};

const sessionExercises: WorkoutExerciseDraft[] = [
  currentExercise,
  {
    planExerciseId: 'plan-fly',
    exerciseId: alreadyUsed.id,
    exerciseDocumentId: alreadyUsed.documentId,
    name: alreadyUsed.name,
    sets: [{ setNumber: 1, loadKg: '0', repetitions: '0', rpe: '8', note: '' }],
  },
];

async function arrange(
  exercise: WorkoutExerciseDraft = currentExercise,
  onReplace = jest.fn(),
) {
  mockUseCatalog.mockReturnValue({
    data: snapshot,
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useExerciseCatalogSnapshot>);

  await render(
    <AppThemeProvider>
      <EquivalentExerciseButton
        exercise={exercise}
        onReplace={onReplace}
        sessionExercises={sessionExercises}
      />
    </AppThemeProvider>,
  );
  return onReplace;
}

describe('EquivalentExerciseButton', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('shows ranked alternatives with translated details and replaces an untouched exercise', async () => {
    const onReplace = await arrange();
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());

    await fireEvent.press(screen.getByTestId('equivalent-exercise-Supino'));

    expect(screen.getByText('Exercícios equivalentes a Supino')).toBeOnTheScreen();
    expect(screen.getByText('Supino máquina')).toBeOnTheScreen();
    expect(screen.queryByText('Crucifixo')).not.toBeOnTheScreen();
    expect(screen.getByText('Principal em comum: Peito')).toBeOnTheScreen();
    expect(screen.getByText('Outros em comum: Tríceps, Ombros')).toBeOnTheScreen();
    expect(screen.getByText('Equipamento: Máquina')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('select-equivalent-machine-document'));

    expect(onReplace).toHaveBeenCalledWith({
      exerciseId: replacement.id,
      exerciseDocumentId: replacement.documentId,
      name: replacement.name,
    });
    expect(announce).toHaveBeenCalledWith('Supino foi substituído por Supino máquina.');
  });

  it('requires confirmation before discarding edited set values', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const onReplace = await arrange({
      ...currentExercise,
      sets: [{ ...currentExercise.sets[0]!, loadKg: '80' }],
    });

    await fireEvent.press(screen.getByLabelText('Exercício equivalente para Supino'));
    await fireEvent.press(screen.getByLabelText('Substituir por Supino máquina'));

    expect(onReplace).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      'Substituir exercício?',
      'Os valores preenchidos em Supino serão apagados.',
      expect.any(Array),
    );
    const actions = alert.mock.calls[0]?.[2];
    const confirm = actions?.find(
      (action) => action.text === 'Substituir e limpar séries',
    );
    await act(() => confirm?.onPress?.());
    expect(onReplace).toHaveBeenCalledTimes(1);
  });

  it('shows a clear state when the active exercise is absent from the catalog', async () => {
    await arrange({
      ...currentExercise,
      exerciseId: 'legacy-id',
      exerciseDocumentId: 'legacy-document',
      name: 'Exercício legado',
    });

    await fireEvent.press(
      screen.getByLabelText('Exercício equivalente para Exercício legado'),
    );

    expect(screen.getByText('Exercício não encontrado')).toBeOnTheScreen();
  });
});

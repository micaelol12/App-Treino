import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';
import { WorkoutExerciseScreen } from './workout-exercise-screen';

const mockBack = jest.fn();
const mockCreate = jest.fn().mockResolvedValue('new-id');

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('../workout-plan-hooks', () => ({
  useWorkoutPlanActions: jest.fn(),
  useWorkoutPlanExercises: jest.fn(),
}));
jest.mock('@/features/workout-divisions/presentation/workout-division-hooks', () => ({
  useWorkoutDivisions: jest.fn(),
}));
jest.mock('@/features/exercise-catalog/presentation/exercise-catalog-hooks', () => ({
  useExerciseCatalog: jest.fn(),
}));

const mockUseExercises = jest.mocked(useWorkoutPlanExercises);
const mockUseActions = jest.mocked(useWorkoutPlanActions);
const mockUseDivisions = jest.mocked(useWorkoutDivisions);
const mockUseCatalog = jest.mocked(useExerciseCatalog);

async function arrange() {
  const queryState = {
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
  };
  mockUseExercises.mockReturnValue({
    ...queryState,
    data: [],
  } as unknown as ReturnType<typeof useWorkoutPlanExercises>);
  mockUseDivisions.mockReturnValue({
    ...queryState,
    data: [
      {
        id: 'push',
        name: 'Push',
        order: 1,
        active: true,
        sourceSchemaVersion: 2,
      },
    ],
  } as unknown as ReturnType<typeof useWorkoutDivisions>);
  mockUseCatalog.mockReturnValue({
    ...queryState,
    data: [
      {
        documentId: 'exercise-document',
        id: 'bench-catalog',
        name: 'Supino',
        force: 'push',
        level: 'iniciante',
        mechanic: 'composto',
        equipment: 'barra',
        primaryMuscles: ['peito'],
        secondaryMuscles: ['triceps'],
        instructions: [],
        category: 'forca',
        images: [],
      },
    ],
  } as unknown as ReturnType<typeof useExerciseCatalog>);
  mockUseActions.mockReturnValue({
    create: { mutateAsync: mockCreate } as unknown as ReturnType<
      typeof useWorkoutPlanActions
    >['create'],
    update: {} as ReturnType<typeof useWorkoutPlanActions>['update'],
    move: {} as ReturnType<typeof useWorkoutPlanActions>['move'],
    remove: {} as ReturnType<typeof useWorkoutPlanActions>['remove'],
  });

  return render(
    <AppThemeProvider>
      <WorkoutExerciseScreen exerciseId="novo" />
    </AppThemeProvider>,
  );
}

describe('WorkoutExerciseScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('validates required selections before creating', async () => {
    await arrange();
    await fireEvent.press(screen.getByTestId('workout-save-button'));
    expect(await screen.findByText('Selecione a divisão.')).toBeOnTheScreen();
    expect(screen.getByText('Selecione o exercício.')).toBeOnTheScreen();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates references using physical and logical catalog IDs', async () => {
    await arrange();

    await fireEvent.press(screen.getByTestId('workout-division-input'));
    await fireEvent.press(screen.getByText('Push'));
    await fireEvent.press(screen.getByTestId('workout-name-input'));
    await fireEvent.press(screen.getByText('Supino'));
    await fireEvent.press(screen.getByTestId('workout-save-button'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        divisionId: 'push',
        divisionNameSnapshot: 'Push',
        exerciseId: 'bench-catalog',
        exerciseDocumentId: 'exercise-document',
        exerciseNameSnapshot: 'Supino',
        defaultSets: 3,
        order: 1,
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});

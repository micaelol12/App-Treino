import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';
import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';

import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';
import { WorkoutPlansSection } from './workout-plans-section';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../workout-plan-hooks', () => ({
  useWorkoutPlanActions: jest.fn(),
  useWorkoutPlanExercises: jest.fn(),
}));
jest.mock('@/features/exercise-catalog/presentation/exercise-catalog-hooks', () => ({
  useExerciseCatalog: jest.fn(),
}));

jest.mock(
  '@/features/workout-divisions/presentation/components/workout-divisions-section',
  () => ({ WorkoutDivisionsSection: () => null }),
);

const mockUseExercises = jest.mocked(useWorkoutPlanExercises);
const mockUseActions = jest.mocked(useWorkoutPlanActions);
const mockUseCatalog = jest.mocked(useExerciseCatalog);

function queryState(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useWorkoutPlanExercises>;
}

function arrange(overrides: Record<string, unknown> = {}) {
  const plans = queryState(overrides);
  mockUseExercises.mockReturnValue(plans);
  mockUseActions.mockReturnValue({
    create: {} as ReturnType<typeof useWorkoutPlanActions>['create'],
    update: {} as ReturnType<typeof useWorkoutPlanActions>['update'],
    move: {
      isPending: false,
      mutateAsync: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useWorkoutPlanActions>['move'],
    remove: {
      isPending: false,
      mutateAsync: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useWorkoutPlanActions>['remove'],
  });
  mockUseCatalog.mockReturnValue({ data: [] } as unknown as ReturnType<
    typeof useExerciseCatalog
  >);

  return render(
    <AppThemeProvider>
      <WorkoutPlansSection plans={plans} />
    </AppThemeProvider>,
  );
}

describe('WorkoutPlansSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the loading state', async () => {
    await arrange({ isLoading: true, isSuccess: false });
    expect(screen.getByText('Carregando plano…')).toBeOnTheScreen();
  });

  it('shows the empty state', async () => {
    await arrange();
    expect(screen.getByText('Nenhum exercício nesta divisão')).toBeOnTheScreen();
  });

  it('shows an actionable error state', async () => {
    const refetch = jest.fn();
    await arrange({
      error: new Error('failed'),
      isError: true,
      isSuccess: false,
      refetch,
    });

    expect(
      screen.getByText('Não foi possível concluir a operação. Tente novamente.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('workout-plan-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders ordered exercises and opens create and edit routes by ID', async () => {
    await arrange({
      data: [
        {
          id: 'exercise-id',
          documentId: 'exercise-document',
          divisionId: 'legacy:Push',
          division: 'Push',
          divisionOrder: 999,
          exerciseId: 'legacy:exercise-id',
          name: 'Supino Reto',
          defaultSets: 3,
          order: 1,
          sourceSchemaVersion: 0,
        },
      ],
    });

    expect(screen.getByText('Supino Reto')).toBeOnTheScreen();
    expect(screen.getByText('3 séries · ordem 1 · legado')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('workout-plan-add'));
    await fireEvent.press(screen.getByTestId('workout-plan-edit-exercise-id'));

    expect(mockPush).toHaveBeenNthCalledWith(1, {
      pathname: '/configuracoes/exercicio/[id]',
      params: { id: 'novo' },
    });
    expect(mockPush).toHaveBeenNthCalledWith(2, {
      pathname: '/configuracoes/exercicio/[id]',
      params: { id: 'exercise-id' },
    });
  });

  it('keeps the selected division in create and edit routes', async () => {
    const plans = queryState({
      data: [
        {
          id: 'exercise-id',
          documentId: 'exercise-document',
          divisionId: 'push',
          division: 'Push',
          divisionOrder: 1,
          exerciseId: 'bench',
          exerciseDocumentId: 'catalog-document',
          name: 'Supino reto',
          defaultSets: 3,
          order: 1,
          sourceSchemaVersion: 2,
        },
        {
          id: 'other-exercise',
          documentId: 'other-document',
          divisionId: 'pull',
          division: 'Pull',
          divisionOrder: 2,
          exerciseId: 'row',
          name: 'Remada',
          defaultSets: 3,
          order: 1,
          sourceSchemaVersion: 2,
        },
      ],
    });
    mockUseExercises.mockReturnValue(plans);
    mockUseActions.mockReturnValue({
      create: {} as ReturnType<typeof useWorkoutPlanActions>['create'],
      update: {} as ReturnType<typeof useWorkoutPlanActions>['update'],
      move: { isPending: false } as ReturnType<typeof useWorkoutPlanActions>['move'],
      remove: { isPending: false } as ReturnType<typeof useWorkoutPlanActions>['remove'],
    });
    mockUseCatalog.mockReturnValue({ data: [] } as unknown as ReturnType<
      typeof useExerciseCatalog
    >);
    await render(
      <AppThemeProvider>
        <WorkoutPlansSection divisionId="push" plans={plans} />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Supino reto')).toBeOnTheScreen();
    expect(screen.queryByText('Remada')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('workout-plan-add'));
    await fireEvent.press(screen.getByTestId('workout-plan-edit-exercise-id'));
    expect(mockPush).toHaveBeenNthCalledWith(1, {
      pathname: '/configuracoes/divisao/[divisionId]/exercicio/[id]',
      params: { divisionId: 'push', id: 'novo' },
    });
    expect(mockPush).toHaveBeenNthCalledWith(2, {
      pathname: '/configuracoes/divisao/[divisionId]/exercicio/[id]',
      params: { divisionId: 'push', id: 'exercise-id' },
    });
  });
});

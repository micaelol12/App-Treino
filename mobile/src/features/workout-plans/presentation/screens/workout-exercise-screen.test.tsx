import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';
import { WorkoutExerciseScreen } from './workout-exercise-screen';

const mockBack = jest.fn();
const mockCreate = jest.fn().mockResolvedValue('new-id');

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('../workout-plan-hooks', () => ({
  useWorkoutPlanActions: jest.fn(),
  useWorkoutPlanExercises: jest.fn(),
}));

const mockUseExercises = jest.mocked(useWorkoutPlanExercises);
const mockUseActions = jest.mocked(useWorkoutPlanActions);

async function arrange() {
  mockUseExercises.mockReturnValue({
    data: [],
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useWorkoutPlanExercises>);
  mockUseActions.mockReturnValue({
    create: {
      mutateAsync: mockCreate,
    } as unknown as ReturnType<typeof useWorkoutPlanActions>['create'],
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

  it('validates required fields before creating', async () => {
    await arrange();

    await fireEvent.press(screen.getByTestId('workout-save-button'));

    expect(await screen.findByText('Informe a divisão.')).toBeOnTheScreen();
    expect(screen.getByText('Informe o exercício.')).toBeOnTheScreen();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a normalized form draft and returns to the plan', async () => {
    await arrange();

    await fireEvent.changeText(screen.getByTestId('workout-division-input'), 'Push');
    await fireEvent.changeText(screen.getByTestId('workout-name-input'), 'Supino');
    await fireEvent.press(screen.getByTestId('workout-save-button'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        division: 'Push',
        name: 'Supino',
        defaultSets: 3,
        order: 1,
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});

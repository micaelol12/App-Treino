import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useAuth } from '@/features/auth/presentation/auth-context';
import { useWorkoutPlanExercises } from '@/features/workout-plans/presentation/workout-plan-hooks';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { WorkoutSessionValidationError } from '../../domain/workout-session-rules';
import { useCompleteWorkoutSession } from '../workout-session-hooks';
import { ManualWorkoutScreen } from './manual-workout-screen';

const mockComplete = jest.fn();

jest.mock('../../application/create-workout-session-id', () => ({
  createWorkoutSessionId: () => 'manual-session-1',
}));

jest.mock('@/features/auth/presentation/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/workout-plans/presentation/workout-plan-hooks', () => ({
  useWorkoutPlanExercises: jest.fn(),
}));

jest.mock('../workout-session-hooks', () => ({
  useCompleteWorkoutSession: jest.fn(),
  useExerciseHistory: () => ({
    data: [],
    isError: false,
    isLoading: false,
    isSuccess: true,
  }),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockUseExercises = jest.mocked(useWorkoutPlanExercises);
const mockUseComplete = jest.mocked(useCompleteWorkoutSession);

const exercises = [
  {
    id: 'bench',
    documentId: 'bench-document',
    divisionId: 'push',
    division: 'Push',
    divisionOrder: 1,
    exerciseId: 'bench-catalog',
    exerciseDocumentId: 'bench-document',
    name: 'Supino',
    defaultSets: 2,
    order: 1,
    sourceSchemaVersion: 2 as const,
  },
  {
    id: 'fly',
    documentId: 'fly-document',
    divisionId: 'push',
    division: 'Push',
    divisionOrder: 1,
    exerciseId: 'fly-catalog',
    exerciseDocumentId: 'fly-document',
    name: 'Crucifixo',
    defaultSets: 1,
    order: 2,
    sourceSchemaVersion: 2 as const,
  },
  {
    id: 'row',
    documentId: 'row-document',
    divisionId: 'pull',
    division: 'Pull',
    divisionOrder: 2,
    exerciseId: 'row-catalog',
    exerciseDocumentId: 'row-document',
    name: 'Remada',
    defaultSets: 3,
    order: 1,
    sourceSchemaVersion: 2 as const,
  },
];

async function arrange() {
  mockUseAuth.mockReturnValue({
    session: { uid: 'user-1', email: 'user@app.local' },
  } as unknown as ReturnType<typeof useAuth>);
  mockUseExercises.mockReturnValue({
    data: exercises,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useWorkoutPlanExercises>);
  mockUseComplete.mockReturnValue({
    isPending: false,
    mutateAsync: mockComplete,
  } as unknown as ReturnType<typeof useCompleteWorkoutSession>);

  return render(
    <AppThemeProvider>
      <ManualWorkoutScreen />
    </AppThemeProvider>,
  );
}

describe('ManualWorkoutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => jest.restoreAllMocks());

  it('builds the complete selected division and saves through the shared use case', async () => {
    mockComplete.mockResolvedValue(2);
    await arrange();

    await fireEvent.press(screen.getByTestId('manual-workout-date-input'));
    await fireEvent.press(screen.getByTestId('manual-workout-date-input-day-2026-08-14'));
    await fireEvent.press(screen.getByTestId('manual-workout-prepare'));

    expect(screen.getAllByText('Supino').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Crucifixo').length).toBeGreaterThan(0);
    expect(screen.queryByText('Remada')).not.toBeOnTheScreen();
    expect(screen.getByTestId('manual-bench-set-2-repetitions')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('manual-bench-set-1-load'), '62,5');
    await fireEvent.changeText(
      screen.getByTestId('manual-bench-set-1-repetitions'),
      '10',
    );
    await fireEvent.changeText(screen.getByTestId('manual-fly-set-1-repetitions'), '12');
    await fireEvent.press(screen.getByTestId('manual-workout-submit'));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'manual-session-1',
          userId: 'user-1',
          performedOn: '2026-08-14',
          divisionId: 'push',
          division: 'Push',
          exercises: [
            expect.objectContaining({
              planExerciseId: 'bench',
              sets: expect.arrayContaining([
                expect.objectContaining({ loadKg: '62,5', repetitions: '10' }),
              ]),
            }),
            expect.objectContaining({
              planExerciseId: 'fly',
              sets: [expect.objectContaining({ repetitions: '12' })],
            }),
          ],
        }),
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Registro salvo',
        '2 séries foram salvas.',
      );
    });
  });

  it('keeps the same idempotent draft and ignores repeated submits', async () => {
    mockComplete.mockReturnValue(new Promise(() => undefined));
    await arrange();

    await fireEvent.press(screen.getByTestId('manual-workout-prepare'));
    await fireEvent.changeText(
      screen.getByTestId('manual-bench-set-1-repetitions'),
      '10',
    );
    await fireEvent.press(screen.getByTestId('manual-workout-submit'));
    await fireEvent.press(screen.getByTestId('manual-workout-submit'));

    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'manual-session-1' }),
    );
  });

  it('shows validation feedback and keeps the form available for correction', async () => {
    mockComplete.mockRejectedValue(
      new WorkoutSessionValidationError('repetitions', 'Supino', 1),
    );
    await arrange();

    await fireEvent.press(screen.getByTestId('manual-workout-prepare'));
    await fireEvent.changeText(
      screen.getByTestId('manual-bench-set-1-repetitions'),
      '1,5',
    );
    await fireEvent.press(screen.getByTestId('manual-workout-submit'));

    expect(
      await screen.findByText(
        'Informe repetições inteiras entre 0 e 1000 em Supino, série 1.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('manual-workout-submit')).toBeOnTheScreen();
  });
});

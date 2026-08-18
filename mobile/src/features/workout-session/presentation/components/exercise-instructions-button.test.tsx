import { fireEvent, render, screen } from '@testing-library/react-native';

import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { ExerciseInstructionsButton } from './exercise-instructions-button';

jest.mock('@/features/exercise-catalog/presentation/exercise-catalog-hooks', () => ({
  useExerciseCatalog: jest.fn(),
}));

const mockUseCatalog = jest.mocked(useExerciseCatalog);

function arrange(instructions: readonly string[]) {
  mockUseCatalog.mockReturnValue({
    data: [
      {
        documentId: 'bench-document',
        id: 'bench-catalog',
        name: 'Supino',
        instructions,
      },
    ],
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useExerciseCatalog>);

  return render(
    <AppThemeProvider>
      <ExerciseInstructionsButton
        exerciseDocumentId="bench-document"
        exerciseId="bench-catalog"
        exerciseName="Supino"
      />
    </AppThemeProvider>,
  );
}

describe('ExerciseInstructionsButton', () => {
  it('opens the exercise instructions from the catalog', async () => {
    await arrange(['Apoie os pés no chão.', 'Desça a barra com controle.']);

    await fireEvent.press(screen.getByTestId('exercise-instructions-Supino'));

    expect(await screen.findByText('Instruções · Supino')).toBeOnTheScreen();
    expect(screen.getByText('Apoie os pés no chão.')).toBeOnTheScreen();
    expect(screen.getByText('Desça a barra com controle.')).toBeOnTheScreen();
  });

  it('shows a clear empty state when instructions are not registered', async () => {
    await arrange([]);

    await fireEvent.press(screen.getByLabelText('Instruções de Supino'));

    expect(await screen.findByText('Instruções indisponíveis')).toBeOnTheScreen();
  });
});

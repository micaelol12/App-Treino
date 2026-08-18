import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import {
  useWorkoutDivisionActions,
  useWorkoutDivisions,
} from '../workout-division-hooks';
import { WorkoutDivisionsSection } from './workout-divisions-section';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('../workout-division-hooks', () => ({
  useWorkoutDivisionActions: jest.fn(),
  useWorkoutDivisions: jest.fn(),
}));

const mockUseDivisions = jest.mocked(useWorkoutDivisions);
const mockUseActions = jest.mocked(useWorkoutDivisionActions);

describe('WorkoutDivisionsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDivisions.mockReturnValue({
      data: [
        {
          id: 'push',
          name: 'Push',
          order: 1,
          active: true,
          sourceSchemaVersion: 2,
        },
      ],
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkoutDivisions>);
    mockUseActions.mockReturnValue({
      create: { isPending: false } as ReturnType<
        typeof useWorkoutDivisionActions
      >['create'],
      update: { isPending: false } as ReturnType<
        typeof useWorkoutDivisionActions
      >['update'],
    });
  });

  it('opens the selected division instead of editing it inline', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutDivisionsSection />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByText('Editar'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/configuracoes/divisao/[divisionId]',
      params: { divisionId: 'push' },
    });
    expect(screen.getByText('Cadastrar divisão')).toBeOnTheScreen();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';
import { WorkoutPlansScreen } from './workout-plans-screen';

const mockBack = jest.fn();
const mockSection = jest.fn(() => <Text>Lista de divisões</Text>);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock(
  '@/features/workout-divisions/presentation/components/workout-divisions-section',
  () => ({
    WorkoutDivisionsSection: () => mockSection(),
  }),
);

jest.mock('@/features/workout-divisions/presentation/workout-division-hooks', () => ({
  useWorkoutDivisions: jest.fn(),
}));

const mockUseDivisions = jest.mocked(useWorkoutDivisions);

describe('WorkoutPlansScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDivisions.mockReturnValue({
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useWorkoutDivisions>);
  });

  it('renders the plan without a duplicate heading and offers explicit back navigation', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutPlansScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Lista de divisões')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { useWorkoutDivisionTemplates } from '../workout-division-template-hooks';
import { WorkoutDivisionTemplatesScreen } from './workout-division-templates-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../workout-division-template-hooks', () => ({
  useWorkoutDivisionTemplates: jest.fn(),
}));

const mockUseTemplates = jest.mocked(useWorkoutDivisionTemplates);

describe('WorkoutDivisionTemplatesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTemplates.mockReturnValue({
      data: [
        {
          id: 'push',
          name: 'Push pronto',
          description: 'Peito, ombros e tríceps.',
          level: 'Intermediário',
          goal: 'Hipertrofia',
          displayOrder: 1,
          exerciseCount: 3,
          version: 1,
        },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useWorkoutDivisionTemplates>);
  });

  it('shows published metadata and opens the selected template', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutDivisionTemplatesScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Push pronto')).toBeOnTheScreen();
    expect(
      screen.getByText('3 exercícios · Intermediário · Hipertrofia'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('division-template-push'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/configuracoes/divisao-pronta/[templateId]',
      params: { templateId: 'push' },
    });
  });
});

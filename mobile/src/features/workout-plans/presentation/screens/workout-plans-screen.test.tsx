import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { WorkoutPlansScreen } from './workout-plans-screen';

const mockBack = jest.fn();
const mockSection = jest.fn(({ showHeading }: { showHeading?: boolean }) => (
  <Text>{showHeading === false ? 'Conteúdo do plano' : 'Cabeçalho duplicado'}</Text>
));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('../components/workout-plans-section', () => ({
  WorkoutPlansSection: (props: { showHeading?: boolean }) => mockSection(props),
}));

describe('WorkoutPlansScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the plan without a duplicate heading and offers explicit back navigation', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutPlansScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Conteúdo do plano')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

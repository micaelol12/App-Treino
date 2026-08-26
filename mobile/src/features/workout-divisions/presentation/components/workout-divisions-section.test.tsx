import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import {
  useWorkoutDivisionActions,
  useWorkoutDivisions,
} from '../workout-division-hooks';
import { WorkoutDivisionsSection } from './workout-divisions-section';

const mockPush = jest.fn();
const mockCreate = jest.fn().mockResolvedValue('new-division');
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockReorder = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
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
        {
          id: 'pull',
          name: 'Pull',
          order: 2,
          active: false,
          sourceSchemaVersion: 2,
        },
      ],
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkoutDivisions>);
    mockUseActions.mockReturnValue({
      create: { isPending: false, mutateAsync: mockCreate } as unknown as ReturnType<
        typeof useWorkoutDivisionActions
      >['create'],
      update: { isPending: false } as ReturnType<
        typeof useWorkoutDivisionActions
      >['update'],
      remove: {
        isPending: false,
        mutateAsync: mockRemove,
      } as unknown as ReturnType<typeof useWorkoutDivisionActions>['remove'],
      reorder: { isPending: false, mutateAsync: mockReorder } as unknown as ReturnType<
        typeof useWorkoutDivisionActions
      >['reorder'],
    });
  });

  it('opens the selected division instead of editing it inline', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutDivisionsSection />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getAllByText('Editar')[0]!);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/configuracoes/divisao/[divisionId]',
      params: { divisionId: 'push' },
    });
    expect(screen.getByText('Cadastrar divisão')).toBeOnTheScreen();
    expect(screen.queryByTestId('division-order-input')).not.toBeOnTheScreen();
  });

  it('creates without order and reorders active and inactive divisions', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutDivisionsSection />
      </AppThemeProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('division-name-input'), 'Legs');
    await fireEvent.press(screen.getByTestId('division-save-button'));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Legs', active: true }),
    );

    const data = mockUseDivisions.mock.results.at(-1)?.value.data ?? [];
    await fireEvent(screen.getByTestId('workout-divisions-draggable-list'), 'dragEnd', {
      data: [...data].reverse(),
      from: 0,
      to: 1,
    });
    await waitFor(() => expect(mockReorder).toHaveBeenCalledWith(['pull', 'push']));
  });

  it('confirms and removes a division while explaining that history is preserved', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await render(
      <AppThemeProvider>
        <WorkoutDivisionsSection />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByTestId('workout-division-delete-pull'));
    expect(alert).toHaveBeenCalledWith(
      'Excluir divisão?',
      expect.stringContaining('histórico de treinos será preservado'),
      expect.any(Array),
    );

    const actions = alert.mock.calls[0]?.[2];
    actions?.find(({ text }) => text === 'Excluir')?.onPress?.();
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('pull'));
    expect(await screen.findByText('Divisão excluída.')).toBeOnTheScreen();
  });
});

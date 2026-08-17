import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { useActiveWorkoutStore } from '../active-workout.store';
import { createInitialWorkoutTimer } from '../workout-timer';
import { WorkoutTimer } from './workout-timer';

describe('WorkoutTimer', () => {
  beforeEach(() => {
    useActiveWorkoutStore.setState({ timer: createInitialWorkoutTimer() });
  });

  it('switches mode and exposes start, pause, continue and reset controls', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutTimer />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByTestId('workout-timer-mode-rest'));
    expect(useActiveWorkoutStore.getState().timer.mode).toBe('rest');

    await fireEvent.press(screen.getByTestId('workout-timer-start'));
    expect(useActiveWorkoutStore.getState().timer.status).toBe('running');

    await fireEvent.press(screen.getByTestId('workout-timer-pause'));
    expect(useActiveWorkoutStore.getState().timer.status).toBe('paused');
    expect(screen.getByText('Continuar')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('workout-timer-reset'));
    expect(useActiveWorkoutStore.getState().timer).toEqual(
      createInitialWorkoutTimer('rest'),
    );
  });
});

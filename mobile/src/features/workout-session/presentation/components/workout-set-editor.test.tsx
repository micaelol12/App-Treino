import { fireEvent, render, screen } from '@testing-library/react-native';

import { InfoModal } from '@/shared/components/info-modal';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { WorkoutSetEditor } from './workout-set-editor';

jest.mock('@/shared/components/info-modal', () => ({
  InfoModal: jest.fn(() => null),
}));

describe('WorkoutSetEditor', () => {
  it('explains RPE from the help action next to the field', async () => {
    await render(
      <AppThemeProvider>
        <WorkoutSetEditor
          exerciseName="Supino"
          onChange={jest.fn()}
          workoutSet={{
            setNumber: 1,
            loadKg: '60',
            repetitions: '10',
            rpe: '8',
            note: '',
          }}
        />
      </AppThemeProvider>,
    );

    const help = screen.getByLabelText('Ajuda sobre RPE');
    expect(help).toHaveProp('accessibilityRole', 'button');

    await fireEvent.press(help);

    expect(jest.mocked(InfoModal).mock.calls.at(-1)?.[0]).toMatchObject({
      title: 'O que é RPE?',
      visible: true,
    });
  });
});

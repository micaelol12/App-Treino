import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { SearchableSelect } from './searchable-select';

describe('SearchableSelect', () => {
  it('filters without accents and selects an option', async () => {
    const onChange = jest.fn();
    await render(
      <AppThemeProvider>
        <SearchableSelect
          label="Exercício"
          onChange={onChange}
          options={['Agachamento', 'Supino inclinado']}
          testID="exercise"
          value="Agachamento"
        />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByTestId('exercise'));
    await fireEvent.changeText(screen.getByTestId('exercise-search'), 'supíno');
    await fireEvent.press(screen.getByText('Supino inclinado'));
    expect(onChange).toHaveBeenCalledWith('Supino inclinado');
  });
});

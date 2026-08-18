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

  it('displays labels but returns stable option values', async () => {
    const onChange = jest.fn();
    await render(
      <AppThemeProvider>
        <SearchableSelect
          label="Exercício"
          onChange={onChange}
          options={[
            {
              value: 'firestore-auto-id',
              label: 'Rosca Direta com Barra',
              description: 'bíceps · barra',
            },
          ]}
          testID="catalog-exercise"
          value=""
        />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByTestId('catalog-exercise'));
    await fireEvent.changeText(screen.getByTestId('catalog-exercise-search'), 'biceps');
    await fireEvent.press(screen.getByText('Rosca Direta com Barra'));
    expect(onChange).toHaveBeenCalledWith('firestore-auto-id');
  });
});

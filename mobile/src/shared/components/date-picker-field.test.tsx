import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { DatePickerField } from './date-picker-field';

describe('DatePickerField', () => {
  it('opens a calendar and returns the selected civil date', async () => {
    const onChange = jest.fn();
    await render(
      <AppThemeProvider>
        <DatePickerField
          label="Data"
          onChange={onChange}
          testID="date"
          value="2026-08-17"
        />
      </AppThemeProvider>,
    );

    expect(screen.getByText('17/08/2026')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('date'));
    expect(screen.getByText('Agosto de 2026')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('date-day-2026-08-14'));
    expect(onChange).toHaveBeenCalledWith('2026-08-14');
  });

  it('navigates between months', async () => {
    await render(
      <AppThemeProvider>
        <DatePickerField
          label="Data"
          onChange={jest.fn()}
          testID="date"
          value="2026-08-17"
        />
      </AppThemeProvider>,
    );
    await fireEvent.press(screen.getByTestId('date'));
    await fireEvent.press(screen.getByTestId('date-next-month'));
    expect(screen.getByText('Setembro de 2026')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('date-previous-month'));
    expect(screen.getByText('Agosto de 2026')).toBeOnTheScreen();
  });
});

import { render } from '@testing-library/react-native';

import { MetricChart } from './metric-chart';

jest.mock('@/shared/theme/theme-provider', () => ({
  useAppTheme: () => jest.requireActual('@/shared/theme/tokens').themes.dark as unknown,
}));

describe('MetricChart', () => {
  it('renders a large dataset in dark mode with an accessible summary', async () => {
    const points = Array.from({ length: 300 }, (_, index) => ({
      label: String(index + 1),
      value: 70 + (index % 10),
    }));
    const screen = await render(
      <MetricChart
        accessibilitySummary="Tendência de 300 registros"
        series={[{ name: 'Peso', color: '#5B5FEF', points }]}
      />,
    );

    expect(screen.getByLabelText('Tendência de 300 registros')).toBeOnTheScreen();
    expect(screen.getByText('Peso')).toBeOnTheScreen();
  });
});

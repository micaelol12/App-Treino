import { render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';

describe('AppText', () => {
  it('renderiza conteúdo usando o tema da aplicação', async () => {
    const { getByText } = await render(
      <AppThemeProvider>
        <AppText>Treino de hoje</AppText>
      </AppThemeProvider>,
    );

    expect(getByText('Treino de hoje')).toBeOnTheScreen();
  });
});

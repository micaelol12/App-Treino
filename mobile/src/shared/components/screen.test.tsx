import { render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';
import { Screen } from './screen';

describe('Screen', () => {
  it('does not show pull-to-refresh when the screen has no refresh action', async () => {
    await render(
      <AppThemeProvider>
        <Screen title="Tela estática">
          <AppText>Conteúdo</AppText>
        </Screen>
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('screen-scroll-view').props.refreshControl).toBeUndefined();
  });

  it('runs the refresh action and reflects its loading state', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AppThemeProvider>
        <Screen onRefresh={onRefresh} refreshing={false} title="Lista">
          <AppText>Item</AppText>
        </Screen>
      </AppThemeProvider>,
    );

    const refreshControl = screen.getByTestId('screen-scroll-view').props.refreshControl;
    refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await view.rerender(
      <AppThemeProvider>
        <Screen onRefresh={onRefresh} refreshing title="Lista">
          <AppText>Item</AppText>
        </Screen>
      </AppThemeProvider>,
    );

    expect(
      screen.getByTestId('screen-scroll-view').props.refreshControl.props.refreshing,
    ).toBe(true);
  });
});

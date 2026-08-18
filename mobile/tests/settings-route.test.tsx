import { fireEvent, render, screen } from '@testing-library/react-native';

import SettingsRoute from '@/app/(app)/(tabs)/configuracoes';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { usePreferencesStore } from '@/shared/stores/preferences.store';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/features/auth/presentation/auth-context', () => ({
  useAuth: jest.fn(),
}));
jest.mock(
  '@/features/exercise-catalog/presentation/components/exercise-catalog-sync-section',
  () => ({ ExerciseCatalogSyncSection: () => null }),
);

const mockUseAuth = jest.mocked(useAuth);

async function arrange() {
  mockUseAuth.mockReturnValue({
    deleteAccount: jest.fn(),
    session: { uid: 'user-1', email: 'user@app.local' },
    signOut: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);

  return render(
    <AppThemeProvider>
      <SettingsRoute />
    </AppThemeProvider>,
  );
}

describe('SettingsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferencesStore.setState({
      themePreference: 'system',
      colorThemePreference: 'purple',
    });
  });

  it('opens the dedicated workout plan screen', async () => {
    await arrange();

    await fireEvent.press(screen.getByTestId('settings-workout-plan'));

    expect(mockPush).toHaveBeenCalledWith('/configuracoes/planos');
    expect(screen.queryByText('Seu plano está vazio')).not.toBeOnTheScreen();
  });

  it('changes the primary color independently from display mode', async () => {
    await arrange();

    await fireEvent.press(screen.getByTestId('theme-color-green'));

    expect(usePreferencesStore.getState()).toEqual(
      expect.objectContaining({
        themePreference: 'system',
        colorThemePreference: 'green',
      }),
    );
    expect(screen.getByTestId('theme-color-green').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });
});

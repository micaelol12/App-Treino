import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { useActiveWorkoutStore } from '../active-workout.store';
import { formatWorkoutTimer, getWorkoutTimerElapsedMs } from '../workout-timer';

export function WorkoutTimer() {
  const theme = useAppTheme();
  const timer = useActiveWorkoutStore((state) => state.timer);
  const start = useActiveWorkoutStore((state) => state.startTimer);
  const pause = useActiveWorkoutStore((state) => state.pauseTimer);
  const reset = useActiveWorkoutStore((state) => state.resetTimer);
  const selectMode = useActiveWorkoutStore((state) => state.selectTimerMode);
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    if (timer.status !== 'running') return;

    const interval = setInterval(() => setNowMs(Date.now()), 50);
    return () => clearInterval(interval);
  }, [timer.status, timer.startedAtMs]);

  const elapsed = formatWorkoutTimer(getWorkoutTimerElapsedMs(timer, nowMs));
  const modeLabel = timer.mode === 'set' ? 'Série' : 'Pausa';

  return (
    <Card>
      <AppText variant="heading">Cronômetro</AppText>
      <View accessibilityRole="radiogroup" style={styles.modes}>
        {(['set', 'rest'] as const).map((mode) => {
          const selected = timer.mode === mode;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={mode}
              onPress={() => selectMode(mode)}
              style={[
                styles.mode,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surfaceMuted,
                },
              ]}
              testID={`workout-timer-mode-${mode}`}
            >
              <AppText
                style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}
              >
                {mode === 'set' ? 'Série' : 'Pausa'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText
        accessibilityLabel={`${modeLabel}: ${elapsed}`}
        accessibilityRole="timer"
        style={styles.elapsed}
        testID="workout-timer-elapsed"
      >
        {elapsed}
      </AppText>
      <View style={styles.actions}>
        {timer.status === 'running' ? (
          <PrimaryButton
            label="Pausar"
            onPress={() => pause()}
            style={styles.action}
            testID="workout-timer-pause"
          />
        ) : (
          <PrimaryButton
            label={timer.status === 'paused' ? 'Continuar' : 'Iniciar'}
            onPress={() => start()}
            style={styles.action}
            testID="workout-timer-start"
          />
        )}
        <SecondaryButton
          disabled={timer.status === 'idle' && timer.accumulatedMs === 0}
          label="Zerar"
          onPress={reset}
          style={styles.action}
          testID="workout-timer-reset"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', gap: spacing.xs },
  mode: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  elapsed: {
    alignSelf: 'center',
    fontSize: 38,
    fontWeight: '700',
    paddingVertical: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});

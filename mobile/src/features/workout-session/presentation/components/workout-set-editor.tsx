import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { WorkoutSetDraft } from '../../domain/workout-session-draft';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type WorkoutSetPatch = Partial<
  Pick<WorkoutSetDraft, 'loadKg' | 'repetitions' | 'rpe' | 'note'>
>;

type WorkoutSetEditorProps = {
  readonly exerciseName: string;
  readonly workoutSet: WorkoutSetDraft;
  readonly onChange: (patch: WorkoutSetPatch) => void;
  readonly testIDPrefix?: string;
};

export function WorkoutSetEditor({
  exerciseName,
  onChange,
  testIDPrefix = 'set',
  workoutSet,
}: WorkoutSetEditorProps) {
  const theme = useAppTheme();
  const repetitionsRef = useRef<TextInput>(null);
  const rpeRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },
  ];
  const prefix = `${exerciseName}, série ${workoutSet.setNumber}`;

  return (
    <Card>
      <AppText style={styles.setTitle}>Série {workoutSet.setNumber}</AppText>
      <View style={styles.numericFields}>
        <View style={styles.field}>
          <AppText variant="caption">Carga (kg)</AppText>
          <TextInput
            accessibilityLabel={`${prefix}, carga em quilogramas`}
            keyboardType="decimal-pad"
            onChangeText={(loadKg) => onChange({ loadKg })}
            onSubmitEditing={() => repetitionsRef.current?.focus()}
            returnKeyType="next"
            selectTextOnFocus
            style={inputStyle}
            testID={`${testIDPrefix}-${workoutSet.setNumber}-load`}
            value={workoutSet.loadKg}
          />
        </View>
        <View style={styles.field}>
          <AppText variant="caption">Repetições</AppText>
          <TextInput
            accessibilityLabel={`${prefix}, repetições`}
            keyboardType="number-pad"
            onChangeText={(repetitions) => onChange({ repetitions })}
            onSubmitEditing={() => rpeRef.current?.focus()}
            ref={repetitionsRef}
            returnKeyType="next"
            selectTextOnFocus
            style={inputStyle}
            testID={`${testIDPrefix}-${workoutSet.setNumber}-repetitions`}
            value={workoutSet.repetitions}
          />
        </View>
        <View style={styles.field}>
          <AppText variant="caption">RPE</AppText>
          <TextInput
            accessibilityLabel={`${prefix}, RPE de 1 a 10`}
            keyboardType="number-pad"
            onChangeText={(rpe) => onChange({ rpe })}
            onSubmitEditing={() => noteRef.current?.focus()}
            ref={rpeRef}
            returnKeyType="next"
            selectTextOnFocus
            style={inputStyle}
            testID={`${testIDPrefix}-${workoutSet.setNumber}-rpe`}
            value={workoutSet.rpe}
          />
        </View>
      </View>
      <View style={styles.noteField}>
        <AppText variant="caption">Observação</AppText>
        <TextInput
          accessibilityLabel={`${prefix}, observação`}
          maxLength={500}
          multiline
          onChangeText={(note) => onChange({ note })}
          placeholder="Opcional"
          placeholderTextColor={theme.colors.textMuted}
          ref={noteRef}
          style={[...inputStyle, styles.noteInput]}
          testID={`${testIDPrefix}-${workoutSet.setNumber}-note`}
          value={workoutSet.note}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  setTitle: { fontWeight: '700' },
  numericFields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { flex: 1, minWidth: 96, gap: spacing.xxs },
  noteField: { gap: spacing.xxs },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
});

import { useLocalSearchParams } from 'expo-router';

import { WorkoutExerciseScreen } from '@/features/workout-plans/presentation/screens/workout-exercise-screen';

export default function DivisionExerciseSettingsRoute() {
  const { divisionId, id } = useLocalSearchParams<{
    divisionId: string;
    id: string;
  }>();
  return <WorkoutExerciseScreen divisionId={divisionId} exerciseId={id} />;
}

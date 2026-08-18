import { useLocalSearchParams } from 'expo-router';

import { WorkoutExerciseScreen } from '@/features/workout-plans/presentation/screens/workout-exercise-screen';

export default function ExerciseSettingsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <WorkoutExerciseScreen exerciseId={id} />;
}

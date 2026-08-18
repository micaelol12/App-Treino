import { useLocalSearchParams } from 'expo-router';

import { WorkoutDivisionDetailsScreen } from '@/features/workout-plans/presentation/screens/workout-division-details-screen';

export default function WorkoutDivisionDetailsRoute() {
  const { divisionId } = useLocalSearchParams<{ divisionId: string }>();
  return <WorkoutDivisionDetailsScreen divisionId={divisionId} />;
}

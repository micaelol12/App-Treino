import { useLocalSearchParams } from 'expo-router';

import { WorkoutDivisionTemplateDetailsScreen } from '@/features/workout-division-templates/presentation/screens/workout-division-template-details-screen';

export default function WorkoutDivisionTemplateDetailsRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  return <WorkoutDivisionTemplateDetailsScreen templateId={templateId} />;
}

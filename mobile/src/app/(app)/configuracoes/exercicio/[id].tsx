import { useLocalSearchParams } from 'expo-router';

import { FeaturePlaceholder } from '@/shared/components/feature-placeholder';

export default function ExerciseSettingsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <FeaturePlaceholder
      title="Configurar exercício"
      description={`Exercício: ${id}`}
      nextStep="As preferências do exercício serão persistidas no plano do usuário."
    />
  );
}

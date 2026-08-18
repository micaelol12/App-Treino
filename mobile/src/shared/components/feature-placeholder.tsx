import { EmptyState } from './empty-state';
import { Screen } from './screen';

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  nextStep: string;
};

export function FeaturePlaceholder({
  description,
  nextStep,
  title,
}: FeaturePlaceholderProps) {
  return (
    <Screen title={title} description={description}>
      <EmptyState title="Estrutura pronta" description={nextStep} />
    </Screen>
  );
}

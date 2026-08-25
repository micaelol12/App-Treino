import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { WorkoutDivisionTemplateRepository } from '../application/workout-division-template-repository';

type RepositoryFactory = () => WorkoutDivisionTemplateRepository;
type Initialization =
  | { readonly repository: WorkoutDivisionTemplateRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const WorkoutDivisionTemplateContext = createContext<Initialization | null>(null);

export function WorkoutDivisionTemplateProvider({
  children,
  repositoryFactory,
}: PropsWithChildren<{ repositoryFactory: RepositoryFactory }>) {
  const [initialization] = useState<Initialization>(() => {
    try {
      return { repository: repositoryFactory(), error: null };
    } catch (error) {
      return {
        repository: null,
        error: error instanceof Error ? error : new Error('Repository unavailable'),
      };
    }
  });
  return (
    <WorkoutDivisionTemplateContext.Provider value={initialization}>
      {children}
    </WorkoutDivisionTemplateContext.Provider>
  );
}

export function useWorkoutDivisionTemplateRepository() {
  const initialization = useContext(WorkoutDivisionTemplateContext);
  if (!initialization) {
    throw new Error(
      'useWorkoutDivisionTemplateRepository deve ser usado dentro do provider.',
    );
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { WorkoutDivisionRepository } from '../application/workout-division-repository';

type RepositoryFactory = () => WorkoutDivisionRepository;
type Initialization =
  | { readonly repository: WorkoutDivisionRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const WorkoutDivisionContext = createContext<Initialization | null>(null);

export function WorkoutDivisionProvider({
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
    <WorkoutDivisionContext.Provider value={initialization}>
      {children}
    </WorkoutDivisionContext.Provider>
  );
}

export function useWorkoutDivisionRepository(): WorkoutDivisionRepository {
  const initialization = useContext(WorkoutDivisionContext);
  if (!initialization) {
    throw new Error('useWorkoutDivisionRepository deve ser usado dentro do provider.');
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

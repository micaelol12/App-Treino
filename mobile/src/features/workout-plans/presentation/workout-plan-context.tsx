import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { WorkoutPlanRepository } from '../application/workout-plan-repository';

type WorkoutPlanRepositoryFactory = () => WorkoutPlanRepository;
type RepositoryInitialization =
  | { readonly repository: WorkoutPlanRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const WorkoutPlanRepositoryContext = createContext<RepositoryInitialization | null>(null);

function initializeRepository(
  repositoryFactory: WorkoutPlanRepositoryFactory,
): RepositoryInitialization {
  try {
    return { repository: repositoryFactory(), error: null };
  } catch (error) {
    return {
      repository: null,
      error: error instanceof Error ? error : new Error('Repository unavailable'),
    };
  }
}

export function WorkoutPlanProvider({
  children,
  repositoryFactory,
}: PropsWithChildren<{ repositoryFactory: WorkoutPlanRepositoryFactory }>) {
  const [initialization] = useState(() => initializeRepository(repositoryFactory));

  return (
    <WorkoutPlanRepositoryContext.Provider value={initialization}>
      {children}
    </WorkoutPlanRepositoryContext.Provider>
  );
}

export function useWorkoutPlanRepository(): WorkoutPlanRepository {
  const initialization = useContext(WorkoutPlanRepositoryContext);
  if (!initialization) {
    throw new Error('useWorkoutPlanRepository deve ser usado dentro do provider.');
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

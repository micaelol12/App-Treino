import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { WorkoutSessionRepository } from '../application/workout-session-repository';

type RepositoryFactory = () => WorkoutSessionRepository;
type RepositoryInitialization =
  | { readonly repository: WorkoutSessionRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const WorkoutSessionRepositoryContext = createContext<RepositoryInitialization | null>(
  null,
);

function initializeRepository(factory: RepositoryFactory): RepositoryInitialization {
  try {
    return { repository: factory(), error: null };
  } catch (error) {
    return {
      repository: null,
      error: error instanceof Error ? error : new Error('Repository unavailable'),
    };
  }
}

export function WorkoutSessionProvider({
  children,
  repositoryFactory,
}: PropsWithChildren<{ repositoryFactory: RepositoryFactory }>) {
  const [initialization] = useState(() => initializeRepository(repositoryFactory));

  return (
    <WorkoutSessionRepositoryContext.Provider value={initialization}>
      {children}
    </WorkoutSessionRepositoryContext.Provider>
  );
}

export function useWorkoutSessionRepository(): WorkoutSessionRepository {
  const initialization = useContext(WorkoutSessionRepositoryContext);
  if (!initialization) {
    throw new Error('useWorkoutSessionRepository deve ser usado dentro do provider.');
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

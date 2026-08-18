import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { ExerciseCatalogRepository } from '../application/exercise-catalog-repository';

type RepositoryFactory = () => ExerciseCatalogRepository;
type Initialization =
  | { readonly repository: ExerciseCatalogRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const ExerciseCatalogContext = createContext<Initialization | null>(null);

export function ExerciseCatalogProvider({
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
    <ExerciseCatalogContext.Provider value={initialization}>
      {children}
    </ExerciseCatalogContext.Provider>
  );
}

export function useExerciseCatalogRepository(): ExerciseCatalogRepository {
  const initialization = useContext(ExerciseCatalogContext);
  if (!initialization) {
    throw new Error('useExerciseCatalogRepository deve ser usado dentro do provider.');
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

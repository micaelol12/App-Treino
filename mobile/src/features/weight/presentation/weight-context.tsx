import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { WeightRepository } from '../application/weight-repository';

type WeightRepositoryFactory = () => WeightRepository;
type RepositoryInitialization =
  | { readonly repository: WeightRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const WeightRepositoryContext = createContext<RepositoryInitialization | null>(null);

export function WeightProvider({
  children,
  repositoryFactory,
}: PropsWithChildren<{ repositoryFactory: WeightRepositoryFactory }>) {
  const [initialization] = useState<RepositoryInitialization>(() => {
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
    <WeightRepositoryContext.Provider value={initialization}>
      {children}
    </WeightRepositoryContext.Provider>
  );
}

export function useWeightRepository(): WeightRepository {
  const initialization = useContext(WeightRepositoryContext);
  if (!initialization) throw new Error('useWeightRepository deve ser usado no provider.');
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

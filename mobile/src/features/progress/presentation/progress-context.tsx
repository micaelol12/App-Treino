import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import type { ProgressRepository } from '../application/progress-repository';

type ProgressRepositoryFactory = () => ProgressRepository;
type RepositoryInitialization =
  | { readonly repository: ProgressRepository; readonly error: null }
  | { readonly repository: null; readonly error: Error };

const ProgressRepositoryContext = createContext<RepositoryInitialization | null>(null);

export function ProgressProvider({
  children,
  repositoryFactory,
}: PropsWithChildren<{ repositoryFactory: ProgressRepositoryFactory }>) {
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
    <ProgressRepositoryContext.Provider value={initialization}>
      {children}
    </ProgressRepositoryContext.Provider>
  );
}

export function useProgressRepository(): ProgressRepository {
  const initialization = useContext(ProgressRepositoryContext);
  if (!initialization) {
    throw new Error('useProgressRepository deve ser usado dentro do provider.');
  }
  if (!initialization.repository) throw initialization.error;
  return initialization.repository;
}

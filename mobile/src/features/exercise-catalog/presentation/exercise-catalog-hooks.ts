import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/presentation/auth-context';

import { useExerciseCatalogRepository } from './exercise-catalog-context';

export function useExerciseCatalog() {
  const { session } = useAuth();
  const repository = useExerciseCatalogRepository();

  return useQuery({
    queryKey: ['exercise-catalog'],
    enabled: Boolean(session),
    staleTime: 30 * 60 * 1000,
    queryFn: () => repository.list(),
  });
}

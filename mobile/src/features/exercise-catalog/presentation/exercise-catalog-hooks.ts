import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/presentation/auth-context';

import { useExerciseCatalogRepository } from './exercise-catalog-context';

export function useExerciseCatalog() {
  const { session } = useAuth();
  const repository = useExerciseCatalogRepository();

  return useQuery({
    queryKey: ['exercise-catalog'],
    enabled: Boolean(session),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: () => repository.ensureAvailable(),
    select: (snapshot) => snapshot.exercises,
  });
}

export function useExerciseCatalogSnapshot() {
  const { session } = useAuth();
  const repository = useExerciseCatalogRepository();
  return useQuery({
    queryKey: ['exercise-catalog'],
    enabled: Boolean(session),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: () => repository.ensureAvailable(),
  });
}

export function useExerciseCatalogSynchronization() {
  const repository = useExerciseCatalogRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repository.synchronize(),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(['exercise-catalog'], snapshot);
    },
  });
}

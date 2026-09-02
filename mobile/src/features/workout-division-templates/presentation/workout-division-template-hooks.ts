import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WorkoutDivisionTemplateService } from '../application/workout-division-template-service';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { useWorkoutDivisionRepository } from '@/features/workout-divisions/presentation/workout-division-context';

import { useWorkoutDivisionTemplateRepository } from './workout-division-template-context';

const listKey = ['workout-division-templates'] as const;

function useService() {
  const templateRepository = useWorkoutDivisionTemplateRepository();
  const divisionRepository = useWorkoutDivisionRepository();
  return useMemo(
    () => new WorkoutDivisionTemplateService(templateRepository, divisionRepository),
    [divisionRepository, templateRepository],
  );
}

export function useWorkoutDivisionTemplates() {
  const { session } = useAuth();
  const service = useService();
  return useQuery({
    queryKey: listKey,
    enabled: Boolean(session),
    queryFn: () => service.listPublished(),
  });
}

export function useWorkoutDivisionTemplate(templateId: string) {
  const { session } = useAuth();
  const service = useService();
  return useQuery({
    queryKey: [...listKey, templateId],
    enabled: Boolean(session && templateId),
    queryFn: () => service.getPublished(templateId),
  });
}

export function useImportWorkoutDivisionTemplate() {
  const { session } = useAuth();
  const service = useService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) => {
      if (!session?.uid) throw new Error('Authenticated user required');
      return service.importToUser(session.uid, templateId, name);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['workout-divisions', session?.uid],
        }),
        queryClient.invalidateQueries({ queryKey: ['workout-plan', session?.uid] }),
      ]);
    },
  });
}

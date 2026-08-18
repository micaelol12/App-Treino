import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapExerciseDocument } from './exercise.mapper';
import { sortExercises } from '../../domain/exercise';

const exercise = {
  id: 'Barbell_Curl',
  name: 'Rosca Direta com Barra',
  force: 'pull',
  level: 'iniciante',
  mechanic: 'isolado',
  equipment: 'barra',
  primaryMuscles: ['biceps'],
  secondaryMuscles: ['antebracos'],
  instructions: ['Mantenha os cotovelos estáveis.'],
  category: 'forca',
  images: ['Barbell_Curl/0.jpg'],
};

describe('mapExerciseDocument', () => {
  it('keeps physical and logical IDs from an auto-ID import', () => {
    expect(mapExerciseDocument('firestore-auto-id', exercise)).toEqual({
      documentId: 'firestore-auto-id',
      ...exercise,
    });
  });

  it('rejects an incomplete catalog document', () => {
    expect(() => mapExerciseDocument('invalid', { id: 'missing-fields' })).toThrow(
      InvalidFirestoreDocumentError,
    );
  });

  it('sorts duplicate names by logical ID', () => {
    const first = mapExerciseDocument('physical-2', { ...exercise, id: 'b' });
    const second = mapExerciseDocument('physical-1', { ...exercise, id: 'a' });
    expect(sortExercises([first, second]).map(({ id }) => id)).toEqual(['a', 'b']);
  });
});

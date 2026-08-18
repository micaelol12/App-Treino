import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { z } from 'zod';

import { database, storage } from '../lib/firebase';

export const exerciseSchema = z.object({
  id: z.string().trim().min(1, 'Informe o ID lógico.').max(160),
  name: z.string().trim().min(1, 'Informe o nome.').max(160),
  force: z.string().trim().nullable(),
  level: z.string().trim().min(1, 'Selecione o nível.'),
  mechanic: z.string().trim().nullable(),
  equipment: z.string().trim().nullable(),
  primaryMuscles: z.array(z.string().trim().min(1)),
  secondaryMuscles: z.array(z.string().trim().min(1)),
  instructions: z.array(z.string().trim().min(1)),
  category: z.string().trim().min(1, 'Selecione a categoria.'),
  // O catálogo legado usa caminhos relativos, enquanto uploads novos usam URLs absolutas.
  images: z.array(z.string().trim().min(1)),
  videoUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
});

export const exerciseFormSchema = exerciseSchema.extend({
  name: z.string().trim().min(2, 'Informe o nome.').max(160),
  primaryMuscles: z
    .array(z.string().trim().min(1))
    .min(1, 'Informe ao menos um músculo principal.'),
  instructions: z
    .array(z.string().trim().min(1))
    .min(1, 'Informe ao menos uma instrução.'),
});

export type Exercise = z.infer<typeof exerciseSchema> & { documentId: string };

export type TaxonomyItem = {
  documentId: string;
  id: string;
  name: string;
  active: boolean;
  order: number;
};

export const taxonomyNames = ['equipamentos', 'categorias', 'forcas', 'niveis', 'mecanicas', 'musculos'] as const;
export type TaxonomyName = (typeof taxonomyNames)[number];

function mapExercise(documentId: string, data: DocumentData): Exercise {
  return { documentId, ...exerciseSchema.parse(data) };
}

export async function listExercises(): Promise<Exercise[]> {
  const snapshot = await getDocs(collection(database, 'exercicios'));
  return snapshot.docs
    .map((item) => mapExercise(item.id, item.data()))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }));
}

export async function getExercise(documentId: string): Promise<Exercise> {
  const snapshot = await getDoc(doc(database, 'exercicios', documentId));
  if (!snapshot.exists()) throw new Error('Exercício não encontrado.');
  return mapExercise(snapshot.id, snapshot.data());
}

export async function listTaxonomy(name: TaxonomyName): Promise<TaxonomyItem[]> {
  const snapshot = await getDocs(query(collection(database, name), orderBy('order', 'asc')));
  return snapshot.docs.map((item) => ({ documentId: item.id, ...item.data() }) as TaxonomyItem);
}

async function uploadExerciseFile(documentId: string, file: File, kind: 'images' | 'videos') {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const fileId = crypto.randomUUID();
  const fileReference = ref(storage, `exercise-media/${documentId}/${kind}/${fileId}.${extension}`);
  await uploadBytes(fileReference, file, { contentType: file.type });
  return getDownloadURL(fileReference);
}

export type SaveExerciseInput = z.infer<typeof exerciseFormSchema> & {
  documentId?: string;
  imageFiles: File[];
  videoFile?: File;
};

export async function saveExercise(input: SaveExerciseInput): Promise<string> {
  const target = input.documentId
    ? doc(database, 'exercicios', input.documentId)
    : doc(collection(database, 'exercicios'));

  const [newImages, newVideo] = await Promise.all([
    Promise.all(input.imageFiles.map((file) => uploadExerciseFile(target.id, file, 'images'))),
    input.videoFile ? uploadExerciseFile(target.id, input.videoFile, 'videos') : Promise.resolve(undefined),
  ]);

  const parsed = exerciseFormSchema.parse({
    id: input.id,
    name: input.name,
    force: input.force || null,
    level: input.level,
    mechanic: input.mechanic || null,
    equipment: input.equipment || null,
    primaryMuscles: input.primaryMuscles,
    secondaryMuscles: input.secondaryMuscles,
    instructions: input.instructions,
    category: input.category,
    images: [...input.images, ...newImages],
    videoUrl: newVideo ?? input.videoUrl ?? null,
    active: input.active ?? true,
  });

  await setDoc(
    target,
    {
      ...parsed,
      updatedAt: serverTimestamp(),
      ...(input.documentId ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
  return target.id;
}

export async function setExerciseActive(documentId: string, active: boolean) {
  await updateDoc(doc(database, 'exercicios', documentId), { active, updatedAt: serverTimestamp() });
}

export async function createEquipment(input: { id: string; name: string; order: number }) {
  await addDoc(collection(database, 'equipamentos'), {
    id: input.id.trim(),
    name: input.name.trim(),
    order: input.order,
    active: true,
  });
}

export async function setEquipmentActive(documentId: string, active: boolean) {
  await updateDoc(doc(database, 'equipamentos', documentId), { active });
}

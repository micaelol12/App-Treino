export interface WorkoutPlanExercise {
  readonly id: string;
  readonly documentId: string;
  readonly divisionId: string;
  readonly division: string;
  readonly divisionOrder: number;
  readonly exerciseId: string;
  readonly exerciseDocumentId?: string;
  readonly name: string;
  readonly defaultSets: number;
  readonly order: number;
  readonly sourceSchemaVersion: 0 | 1 | 2;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

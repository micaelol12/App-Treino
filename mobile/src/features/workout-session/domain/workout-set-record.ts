export interface WorkoutSetRecord {
  readonly id: string;
  readonly performedOn: string;
  readonly workoutName: string;
  readonly divisionId?: string;
  readonly exerciseId?: string;
  readonly exerciseDocumentId?: string;
  readonly exerciseName: string;
  readonly setNumber: number;
  readonly loadKg: number;
  readonly repetitions: number;
  readonly rpe: number;
  readonly note: string;
  readonly sessionId?: string;
  readonly sourceSchemaVersion: 0 | 1 | 2;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

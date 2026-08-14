export interface WorkoutPlanExercise {
  readonly id: string;
  readonly division: string;
  readonly name: string;
  readonly defaultSets: number;
  readonly order: number;
  readonly sourceSchemaVersion: 0 | 1;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

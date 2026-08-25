export type WorkoutDivisionTemplateExercise = {
  readonly exerciseId: string;
  readonly exerciseDocumentId: string;
  readonly exerciseNameSnapshot: string;
  readonly defaultSets: number;
  readonly order: number;
};

export type WorkoutDivisionTemplate = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly level: string;
  readonly goal: string;
  readonly displayOrder: number;
  readonly exerciseCount: number;
  readonly version: number;
};

export type WorkoutDivisionTemplateDetails = WorkoutDivisionTemplate & {
  readonly exercises: readonly WorkoutDivisionTemplateExercise[];
};

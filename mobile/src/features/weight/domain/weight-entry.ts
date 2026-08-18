export interface WeightEntry {
  readonly id: string;
  readonly recordedOn: string;
  readonly weightKg: number;
  readonly sourceSchemaVersion: 0 | 1;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

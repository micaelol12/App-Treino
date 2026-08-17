import type { WeightEntry } from '../domain/weight-entry';
import type { WeightEntryDraft } from '../domain/weight-rules';

export interface WeightPageCursor {
  readonly id: string;
  readonly recordedOn: string;
}

export interface WeightPage {
  readonly entries: WeightEntry[];
  readonly nextCursor: WeightPageCursor | null;
}

export interface WeightRepository {
  listPage(
    userId: string,
    pageSize: number,
    cursor?: WeightPageCursor,
  ): Promise<WeightPage>;
  upsert(userId: string, draft: WeightEntryDraft): Promise<void>;
}

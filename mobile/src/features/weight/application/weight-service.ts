import type { WeightRepository } from './weight-repository';
import { validateWeightEntryDraft, type WeightEntryDraft } from '../domain/weight-rules';

export class WeightService {
  constructor(private readonly repository: WeightRepository) {}

  listPage(...parameters: Parameters<WeightRepository['listPage']>) {
    return this.repository.listPage(...parameters);
  }

  async upsert(userId: string, draft: WeightEntryDraft): Promise<void> {
    await this.repository.upsert(userId, validateWeightEntryDraft(draft));
  }

  async replace(
    userId: string,
    originalDocumentId: string,
    draft: WeightEntryDraft,
  ): Promise<void> {
    await this.repository.replace(
      userId,
      originalDocumentId,
      validateWeightEntryDraft(draft),
    );
  }

  async delete(userId: string, documentId: string): Promise<void> {
    await this.repository.delete(userId, documentId);
  }
}

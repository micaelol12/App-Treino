const { catalogIndexes, divisionDocumentId, normalize, resolveExercise } =
  require('../scripts/migrate-workout-plans-v2.cjs') as {
    catalogIndexes(snapshot: unknown): {
      byId: Map<string, unknown>;
      byName: Map<string, unknown[]>;
    };
    divisionDocumentId(name: string): string;
    normalize(value: string): string;
    resolveExercise(
      legacyName: string,
      aliases: Record<string, string>,
      indexes: unknown,
    ): { status: string; strategy?: string; exercise?: { id: string } };
  };

function snapshot(documents: Array<{ documentId: string; id: string; name: string }>) {
  return {
    docs: documents.map(({ documentId, ...data }) => ({
      id: documentId,
      data: () => data,
    })),
  };
}

describe('workout plan v2 migration helpers', () => {
  it('normalizes names and creates stable division IDs', () => {
    expect(normalize('  Púsh   A ')).toBe('push a');
    expect(divisionDocumentId('Púsh A')).toBe(divisionDocumentId('push a'));
  });

  it('resolves by alias before exact normalized name', () => {
    const indexes = catalogIndexes(
      snapshot([
        { documentId: 'auto-1', id: 'Barbell_Curl', name: 'Rosca Direta com Barra' },
      ]),
    );
    expect(
      resolveExercise('Rosca Direta', { 'Rosca Direta': 'Barbell_Curl' }, indexes),
    ).toMatchObject({
      status: 'resolved',
      strategy: 'alias',
      exercise: { id: 'Barbell_Curl' },
    });
    expect(resolveExercise('rosca direta com barra', {}, indexes)).toMatchObject({
      status: 'resolved',
      strategy: 'exact-normalized-name',
    });
  });

  it('reports ambiguous duplicate names instead of choosing silently', () => {
    const indexes = catalogIndexes(
      snapshot([
        { documentId: 'auto-1', id: 'first', name: 'Supino com Correntes' },
        { documentId: 'auto-2', id: 'second', name: 'Supino com Correntes' },
      ]),
    );
    expect(resolveExercise('Supino com Correntes', {}, indexes)).toMatchObject({
      status: 'ambiguous',
    });
  });
});

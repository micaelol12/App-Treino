import { buildSanitizedErrorEvent } from './error-reporter';

describe('error telemetry', () => {
  it('envia somente metadados permitidos, sem mensagem, pilha ou dados pessoais', () => {
    const error = new Error(
      'usuario@example.com token=secret observação privada documento abc-123',
    );
    error.name = 'InvalidFirestoreDocumentError';
    error.stack = 'stack com senha Treino123';

    const event = buildSanitizedErrorEvent(
      'legacy_document_rejected',
      error,
      {
        collection: 'historico_treinos',
        failureCode: 'invalid-data',
        issueCodes: ['invalid_type'],
        issuePaths: ['Carga'],
      },
      { appVersion: '0.8.0', platform: 'android', variant: 'staging' },
      new Date('2026-08-17T12:00:00.000Z'),
    );

    expect(event).toEqual({
      appVersion: '0.8.0',
      collection: 'historico_treinos',
      errorType: 'invalid-document',
      event: 'legacy_document_rejected',
      failureCode: 'invalid-data',
      issueCodes: ['invalid_type'],
      issuePaths: ['Carga'],
      platform: 'android',
      recordedAt: '2026-08-17T12:00:00.000Z',
      variant: 'staging',
    });
    expect(JSON.stringify(event)).not.toMatch(
      /usuario@example|secret|privada|abc-123|Treino123/,
    );
  });

  it('descarta contexto livre que poderia carregar dados sensíveis', () => {
    const event = buildSanitizedErrorEvent(
      'remote_operation_failed',
      new Error('falha'),
      {
        collection: 'email usuario@example.com',
        failureCode: 'network request for usuario@example.com',
        issueCodes: ['invalid_type', 'senha secreta'],
        issuePaths: ['Peso', 'observação privada'],
      },
      { appVersion: '0.8.0', platform: 'ios', variant: 'production' },
      new Date('2026-08-17T12:00:00.000Z'),
    );

    expect(event.collection).toBeUndefined();
    expect(event.failureCode).toBeUndefined();
    expect(event.issueCodes).toEqual(['invalid_type']);
    expect(event.issuePaths).toEqual(['Peso']);
  });
});

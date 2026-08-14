import { parsePublicEnvironment } from './environment';

const validEnvironment = {
  firebaseApiKey: 'api-key',
  firebaseAuthDomain: 'app.firebaseapp.com',
  firebaseProjectId: 'app-treino',
  firebaseStorageBucket: 'app-treino.appspot.com',
  firebaseMessagingSenderId: '123',
  firebaseAppId: '1:123:android:abc',
};

describe('parsePublicEnvironment', () => {
  it('retorna uma configuração pública válida', () => {
    expect(parsePublicEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it('rejeita configuração incompleta antes de inicializar o Firebase', () => {
    expect(() =>
      parsePublicEnvironment({ ...validEnvironment, firebaseProjectId: undefined }),
    ).toThrow();
  });

  it('valida as variáveis incorporadas quando nenhum valor é informado', () => {
    expect(() => parsePublicEnvironment()).toThrow();
  });
});

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

  it('aceita a URL opcional do Auth Emulator', () => {
    expect(
      parsePublicEnvironment({
        ...validEnvironment,
        firebaseAuthEmulatorUrl: 'http://10.0.2.2:9099',
      }).firebaseAuthEmulatorUrl,
    ).toBe('http://10.0.2.2:9099');
  });

  it('aceita a URL opcional do Firestore Emulator', () => {
    expect(
      parsePublicEnvironment({
        ...validEnvironment,
        firebaseFirestoreEmulatorUrl: 'http://10.0.2.2:8080',
      }).firebaseFirestoreEmulatorUrl,
    ).toBe('http://10.0.2.2:8080');
  });

  it('trata a URL vazia do Auth Emulator como não configurada', () => {
    expect(
      parsePublicEnvironment({
        ...validEnvironment,
        firebaseAuthEmulatorUrl: '',
      }).firebaseAuthEmulatorUrl,
    ).toBeUndefined();
  });

  it('rejeita uma URL inválida do Auth Emulator', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validEnvironment,
        firebaseAuthEmulatorUrl: 'not-an-url',
      }),
    ).toThrow();
  });

  it('valida as variáveis incorporadas quando nenhum valor é informado', () => {
    expect(() => parsePublicEnvironment()).toThrow();
  });
});

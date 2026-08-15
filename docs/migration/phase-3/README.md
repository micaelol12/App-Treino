# Fase 3 — autenticação

## Resultado

A autenticação por e-mail e senha usa Firebase Auth atrás da porta `AuthGateway`.
O aplicativo oferece cadastro, login, redefinição de senha, logout e restauração da
sessão oficial persistida pelo SDK Firebase em `AsyncStorage`.

As rotas privadas são protegidas por `Stack.Protected`. Quando a sessão é removida
pelo Firebase, o grupo autenticado deixa de fazer parte da árvore de navegação. O
aplicativo não armazena nem aceita um UID paralelo; a identidade consumida pela UI é
sempre emitida por `onAuthStateChanged`, enquanto as regras Firestore continuam
validando `request.auth.uid` no servidor.

## Arquitetura

- `domain`: modelo imutável da sessão;
- `application`: porta `AuthGateway` e falhas independentes do Firebase;
- `infrastructure/firebase`: inicialização com persistência, adapter e tradução de
  erros;
- `presentation`: provider de sessão, validação Zod, formulários e mensagens seguras;
- `src/app`: somente composição, rotas e proteção dos grupos.

Erros de credencial não informam se um e-mail está cadastrado. A redefinição também
usa uma confirmação neutra para reduzir enumeração de contas.

## Executar com Auth Emulator

No primeiro terminal:

```powershell
cd mobile
Copy-Item .env.emulator.example .env.local
npm run emulator:start
```

No segundo terminal, reinicie o Metro para carregar as variáveis:

```powershell
cd mobile
npm run android
```

O template usa `10.0.2.2` para o Android Emulator acessar a porta 9099 da máquina
host. No iOS Simulator, troque o endereço por `127.0.0.1`.

## Teste ponta a ponta

Com o Auth Emulator recém-iniciado, o Development Build instalado e o Maestro
disponível no `PATH`:

```powershell
cd mobile
maestro test .maestro/auth-flow.yaml
```

O fluxo cria uma conta local, confirma a restauração após reiniciar o app, encerra a
sessão, verifica o bloqueio e entra novamente. Reinicie o Auth Emulator antes de
repetir o teste porque a conta utiliza um e-mail fixo.

## Configuração de projeto real

Para homologação ou produção, copie `.env.example` para `.env.local`, preencha apenas
as configurações públicas do aplicativo Firebase e deixe
`EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` vazio. O provedor **E-mail/senha** precisa
estar habilitado no console Firebase correspondente.

Nenhuma chave administrativa, service account ou segredo deve ser armazenado em
variáveis `EXPO_PUBLIC_*`.

## Validação executada

Em 15 de agosto de 2026:

- Expo Doctor: 21 de 21 verificações aprovadas;
- typecheck, ESLint e Prettier sem erros ou avisos;
- 49 testes unitários e de componente aprovados;
- cobertura de 100% de linhas e 88,63% de branches no conjunto monitorado;
- 21 testes das regras Firestore aprovados;
- fluxo Android validado contra o Auth Emulator: cadastro, desbloqueio das rotas
  privadas, restauração após reiniciar o processo, logout com bloqueio e novo login;
- tela de redefinição validada por teste de componente com confirmação neutra.

O fluxo Maestro está versionado, mas não foi executado nesta máquina porque o CLI
`maestro` não está instalado. A validação Android equivalente foi realizada no AVD
`Pixel_10` por automação ADB.

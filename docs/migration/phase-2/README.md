# Fase 2 — fundação React Native

## Resultado

A fundação móvel usa Expo SDK 57, React Native 0.86, React 19 e Expo Router. O shell
inclui navegação por abas, rotas de autenticação e detalhes, tema claro/escuro,
tratamento global de erros, TanStack Query e preferências persistidas com Zustand.

## Limites arquiteturais

- `src/app`: composição e rotas; não contém regras de negócio.
- `src/features/*/domain`: entidades e regras sem dependência de framework.
- `src/features/*/application`: casos de uso e portas.
- `src/features/*/infrastructure`: adapters concretos, inclusive Firestore.
- `src/features/*/presentation`: telas e hooks específicos da funcionalidade.
- `src/shared`: componentes, configuração e infraestrutura transversal.

O ESLint impede dependências de React, Expo e Firebase no domínio e impede UI ou
infraestrutura concreta na camada de aplicação.

## Ambientes

`APP_VARIANT` controla identificadores e nomes nativos. Os perfis EAS são:

- `development`: Development Build interno;
- `preview`: build interno ligado ao ambiente de staging;
- `production`: build de loja com incremento automático.

Copie `.env.example` para `.env.local` durante o desenvolvimento. Valores
`EXPO_PUBLIC_*` são públicos e nunca devem conter credenciais privilegiadas.

## Comandos

```bash
npm install
npm run doctor
npm run start
npm run verify
npm run test:rules
```

Para gerar builds instaláveis, configure o projeto EAS e execute
`eas build --profile development --platform android` ou `--platform ios`.

## Validação executada

- Expo Doctor: 21 de 21 verificações aprovadas;
- bundle Android de produção gerado localmente pelo Metro (1.325 módulos);
- typecheck, ESLint e Prettier sem erros ou avisos;
- 29 testes unitários aprovados, com 100% de linhas e 82,14% de branches;
- 21 testes das regras do Firestore aprovados no Emulator Suite.

Os testes usam `firebase.test.json` na porta 8081, permitindo manter o emulador de
desenvolvimento da porta 8080 aberto durante a verificação local.

Os binários de Development Build não foram enviados ao EAS porque isso exige vínculo
com uma conta e um projeto Expo. Os perfis, identificadores e o `expo-dev-client`
estão configurados para gerar esses binários sem mudança de código.

## Auditoria de dependências

Em 14 de agosto de 2026, `npm audit --omit=dev` reportou 23 alertas transitivos
(15 altos e 8 moderados) no toolchain oficial do Expo/React Native: `image-size`
via Metro e `uuid` via `xcode`. A correção automática sugere regressões incompatíveis
para React Native 0.72 ou Expo 53, por isso não foi aplicada. O CI bloqueia alertas
críticos e esses transitivos devem ser reavaliados a cada atualização do SDK.

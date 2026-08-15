# App Treino — React Native

Aplicativo móvel de acompanhamento de treinos construído com Expo SDK 57,
React Native 0.86, TypeScript e Expo Router.

## Estado atual

O projeto já pode ser executado por meio de um Development Build. A autenticação, a
configuração do plano e o treino ativo estão integrados ao Firebase. É possível
selecionar uma divisão, preencher séries com rascunho local restaurável e concluir a
sessão em batch idempotente, além de listar, adicionar, editar, reordenar e excluir
exercícios por ID preservando os documentos legados. As demais telas de negócio
ainda são incrementais.

O antigo aplicativo Streamlit foi retirado. A documentação histórica e os contratos
Firestore foram preservados para garantir compatibilidade com os dados existentes.

## Pré-requisitos

- Node.js 24 LTS (recomendado: 24.19.0);
- npm;
- uma conta Expo para gerar Development Builds pelo EAS;
- Java JDK 21 somente para executar os testes das regras Firestore;
- Android Studio para usar um emulador Android local;
- macOS com Xcode para usar o simulador iOS local.

Confira as versões instaladas:

```powershell
node --version
npm --version
java --version
```

## Instalação

Execute a partir da raiz do repositório:

```powershell
cd mobile
npm install
```

Para usar um projeto Firebase real, prepare as variáveis públicas:

```powershell
Copy-Item .env.example .env.local
```

Para testar a autenticação apenas no emulador local:

```powershell
Copy-Item .env.emulator.example .env.local
```

As variáveis `EXPO_PUBLIC_*` são incluídas no aplicativo e não podem conter segredos,
tokens administrativos ou arquivos de service account. Sem a configuração, o app
abre a tela de login em modo seguro e informa que o Firebase ainda não foi preparado.

## Compatibilidade com Expo Go

Este projeto usa Expo SDK 57. Durante a transição desse SDK, o Expo Go distribuído
pelas lojas em aparelhos físicos ainda não inclui o runtime 57. Por isso, atualizar o
Expo Go não elimina o erro de versão. Consulte a
[orientação oficial do Expo](https://docs.expo.dev/get-started/create-a-project/).

A orientação oficial é usar SDK 54 quando Expo Go em aparelho físico for obrigatório.
Este projeto mantém o SDK 57 e usa Development Build para evitar uma regressão de
React Native e das dependências já validadas.

## Executar com Development Build no Android

### Opção 1 — build local

Requer Android Studio, Android SDK e um emulador aberto ou aparelho com depuração USB:

No Android Studio, abra **More Actions > SDK Manager** e confirme a instalação do
Android SDK Platform 36, Android SDK Build-Tools, Android SDK Platform-Tools e
Android Emulator. Depois, em **More Actions > Virtual Device Manager**, crie e
inicie um dispositivo virtual.

No Windows, o SDK costuma ficar em `%LOCALAPPDATA%\Android\Sdk`. Configure
`ANDROID_HOME` com esse diretório e inclua estas pastas no `Path` do usuário:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

Reabra o terminal após alterar as variáveis e valide a configuração:

```powershell
adb --version
emulator -list-avds
adb devices -l
```

Inicie o AVD pelo Virtual Device Manager ou pelo terminal. Nesta máquina, o AVD
criado se chama `Pixel_10`:

```powershell
emulator -avd Pixel_10
adb devices -l
```

Espere o resultado do `adb` mostrar `device`; `offline` significa que o Android
ainda está inicializando. O primeiro boot pode levar alguns minutos.

Com o emulador pronto, gere e instale o Development Build pela primeira vez:

```powershell
cd mobile
npx expo run:android --device Pixel_10
```

Nas execuções seguintes, mantenha o Development Build instalado, abra o emulador e
use:

```powershell
cd mobile
npm run android
```

`expo run:android` gera, instala e abre o aplicativo nativo. A primeira compilação
também pode instalar NDK e CMake automaticamente e, por isso, demora mais. O comando
`npm run android` inicia o Metro e abre o Development Build já instalado.

### Opção 2 — build Android pelo EAS

Não exige Android Studio local:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android
```

Quando o EAS terminar, baixe e instale o APK indicado. Depois execute:

```powershell
cd mobile
npm run start
```

Abra o aplicativo `App Treino (Dev)` instalado, em vez do Expo Go.

## Executar com Development Build no iOS

O build local exige macOS e Xcode:

```bash
cd mobile
npx expo run:ios --device
```

Para um iPhone físico a partir do Windows, use o EAS; essa opção exige as credenciais
da Apple e o registro do aparelho:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform ios
```

O EAS solicita a conta Expo e a vinculação do projeto na primeira execução.

## Comandos de qualidade e testes

Todos os comandos abaixo devem ser executados dentro de `mobile`.

| Comando                      | Finalidade                                                             |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm test`                   | Executa os testes unitários e de componentes.                          |
| `npm run test:unit`          | Equivalente explícito da suíte unitária.                               |
| `npm run test:unit:coverage` | Executa testes unitários com relatório de cobertura.                   |
| `npm run test:rules`         | Inicia o Firestore Emulator na porta 8082, testa as regras e encerra.  |
| `npm run verify`             | Executa TypeScript, ESLint, Prettier e testes unitários com cobertura. |
| `npm run test:all`           | Executa todo o pipeline, incluindo as regras Firestore.                |
| `npm run typecheck`          | Valida os tipos sem gerar arquivos.                                    |
| `npm run lint`               | Valida padrões de código e limites arquiteturais.                      |
| `npm run format:check`       | Verifica a formatação sem alterar arquivos.                            |
| `npm run format`             | Formata os arquivos com Prettier.                                      |
| `npm run doctor`             | Verifica a compatibilidade das dependências com o Expo.                |

Para a validação completa antes de um commit:

```powershell
cd mobile
npm run doctor
npm run test:all
```

O teste de regras baixa/inicia o Firestore Emulator e requer Java. Ele usa o projeto
local `demo-app-treino`, sem acessar recursos Firebase de produção.

## Firebase Emulator para desenvolvimento

Para manter o emulador aberto, use dois terminais dentro de `mobile`.

Terminal 1:

```powershell
npm run emulator:start
```

Terminal 2, para carregar a fixture local:

```powershell
npm run emulator:seed
```

O Auth Emulator usa a porta 9099, o Firestore de desenvolvimento usa 8080, o Metro
usa 8081 e a suíte automatizada de regras usa 8082. Para autenticação local no
Android Emulator, copie `.env.emulator.example` para `.env.local` antes de iniciar o
Metro.

## Estrutura principal

```text
mobile/
  src/app/                 Rotas e composição do Expo Router
  src/features/            Domínio, casos de uso, infraestrutura e apresentação
  src/shared/              Tema, componentes, configuração e utilitários comuns
  tests/                   Contratos e regras Firestore
firebase/                  Security Rules e índices
docs/                      ADRs e histórico da migração
```

As regras de importação impedem que o domínio dependa de React, Expo ou Firebase e
que os casos de uso dependam de UI ou infraestrutura concreta.

## Solução de problemas

### Nenhum dispositivo Android conectado

Para o erro `No Android connected device found`, confirme primeiro se o AVD existe e
está visível para o ADB:

```powershell
emulator -list-avds
emulator -avd Pixel_10
adb kill-server
adb start-server
adb devices -l
```

Se aparecer `offline`, aguarde o boot. Caso o estado não mude, encerre o emulador e
use **Cold Boot Now** no Virtual Device Manager. Se a lista estiver vazia, confirme
`ANDROID_HOME`, o `Path` e reabra o terminal. Em um aparelho físico, habilite as
Opções do desenvolvedor e a depuração USB; no Windows, também pode ser necessário o
driver USB do fabricante.

Consulte a configuração oficial do
[emulador Android no Expo](https://docs.expo.dev/workflow/android-studio-emulator/)
e de [dispositivos físicos no Android](https://developer.android.com/studio/run/device.html#developer-device-options).

### O primeiro bundle excedeu o tempo limite

Na primeira abertura, o Metro ainda precisa compilar todos os módulos. Se o log
mostrar que o bundle terminou depois de o aplicativo perder a conexão, mantenha o
emulador aberto e execute novamente:

```powershell
npm run android
```

Com o cache criado, o segundo bundle deve ser significativamente mais rápido.

### Erro de versão no Expo Go

Não abra este projeto SDK 57 no Expo Go disponível na loja. Instale o Development
Build conforme as instruções acima e inicie o Metro com `npm run start`.

### O Development Build não conecta ao Metro

Confirme que celular e computador estão na mesma rede ou use:

```powershell
npm run start -- --tunnel
```

### A porta 8080 está ocupada

Já pode existir um emulador de desenvolvimento aberto. Encerre o terminal anterior
ou continue usando a instância existente. Os testes usam a porta 8082 separadamente.

### Java não foi encontrado

Instale o JDK 21 e reabra o terminal antes de executar `npm run test:rules`.

### Dependências incompatíveis

```powershell
npm run doctor
npx expo install --check
```

## Documentação

- [Plano de migração](PLANO_MIGRACAO_REACT_NATIVE.md)
- [Fundação React Native — fase 2](docs/migration/phase-2/README.md)
- [Autenticação — fase 3](docs/migration/phase-3/README.md)
- [Configuração de treinos — fase 4](docs/migration/phase-4/README.md)
- [Configuração local do Firebase](firebase/README.md)

# Fase 4 — Configuração de treinos

Status: **concluída e publicada em 15/08/2026**.

## Entregas

- listagem autenticada de `usuarios/{uid}/config_treinos`, agrupada por divisão e
  ordenada no domínio;
- leitura compatível com documentos legados sem `Ordem`, usando fallback `99`;
- cadastro e edição com normalização de espaços, limites do contrato e bloqueio de
  nomes ou ordens duplicados na mesma divisão; a comparação de nomes não diferencia
  caixa ou acentos;
- reordenação dentro da divisão em batch, normalizando posições repetidas ou
  legadas;
- exclusão pelo ID exato do documento, com confirmação e feedback;
- estados de carregamento, vazio, erro, conteúdo, atualização e operação em curso;
- novas escritas com `schemaVersion = 1`, `createdAt` e `updatedAt` usando horário do
  servidor;
- conexão independente com o Firestore Emulator pela variável
  `EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL`.

## Arquitetura

As regras de normalização, duplicidade, ordenação e movimentação são puras e ficam
no domínio. O serviço de aplicação coordena essas regras com o contrato do
repositório. A implementação Firebase mantém os campos legados (`Divisao`,
`Exercicio`, `Series_Padrao` e `Ordem`) restritos à infraestrutura. A apresentação
usa TanStack Query para cache, atualização e estados remotos.

## Compatibilidade e segurança

- nenhum documento legado é migrado ou sobrescrito apenas por ser lido;
- documentos sem `Ordem` continuam aparecendo ao final;
- atualização, reordenação e exclusão usam o ID, nunca o nome do exercício;
- a reordenação grava todas as posições afetadas atomicamente;
- as Security Rules continuam limitando cada caminho ao UID autenticado e validam
  os limites de todos os campos.

## Validação

Na pasta `mobile`:

```powershell
npm run verify
npm run test:rules
```

O teste de integração do repositório executa leitura legada, criação, atualização,
reordenação em batch e exclusão por ID contra o Firestore Emulator. A suíte de
componentes cobre os estados de carregamento, vazio, erro e conteúdo da listagem.

Com os emuladores reiniciados, o Development Build aberto e o Maestro disponível:

```powershell
maestro test .maestro/workout-plan-flow.yaml
```

O fluxo versionado cria uma conta local, cadastra dois exercícios, reordena, edita e
exclui com confirmação. Ele usa um e-mail fixo; reinicie o Auth Emulator antes de
repetir a execução.

### Resultado local

- Expo Doctor: 21 de 21 verificações aprovadas;
- typecheck, ESLint e Prettier aprovados;
- 82 testes unitários e de componente aprovados;
- cobertura monitorada: 99,08% de linhas e 90,09% de branches;
- 23 testes de regras e integração aprovados no Firestore Emulator.
- regras e índices publicados com sucesso no projeto Firebase
  `projeto-treino-505118`.

O fluxo Maestro foi versionado, mas não executado nesta máquina porque o CLI não
está instalado.

## Critério de saída

- [x] contrato legado preservado;
- [x] CRUD e reordenação disponíveis no aplicativo móvel;
- [x] validação de duplicidade e limites;
- [x] estados remotos e confirmação destrutiva;
- [x] repositório validado no Firestore Emulator;
- [x] typecheck, lint, formatação e testes automatizados.

# Fase 1 — Segurança e contrato de dados

Status: **concluída e validada localmente em 14/08/2026**.

## Entregas

| Entrega | Local |
| --- | --- |
| Security Rules | `firebase/firestore.rules` |
| Índices compostos | `firebase/firestore.indexes.json` |
| Emulator Suite | `firebase.json` e `.firebaserc` |
| Schemas Zod | `mobile/src/features/*/infrastructure/firestore/*.schema.ts` |
| Mapeadores | `mobile/src/features/*/infrastructure/firestore/*.mapper.ts` |
| Testes unitários/fixture | arquivos `*.test.ts` e `mobile/tests/firestore-contract.fixture.test.ts` |
| Testes das regras | `mobile/tests/firestore.rules.test.ts` |
| Seed idempotente da fixture | `mobile/scripts/seed-firestore-emulator.cjs` |
| ADRs | `docs/architecture/decisions/` |

## Contratos cobertos

- `config_treinos`: campos legados obrigatórios, `Ordem` opcional e fallback 99;
- `historico_treinos`: campos com acento isolados no DTO, séries executadas e metadados opcionais;
- `historico_pesos`: data civil e peso dentro dos limites do produto;
- documentos novos podem adicionar `schemaVersion = 1`, `createdAt`, `updatedAt` e, no histórico, `sessionId`;
- campos desconhecidos são rejeitados tanto pelo Zod quanto pelas Security Rules.

As regras validam o formato `YYYY-MM-DD`. A validação Zod também rejeita datas inexistentes, como `2026-02-30`, porque a linguagem de regras não é o local adequado para implementar um calendário completo.

## Garantias de segurança testadas

- proprietário pode operar apenas suas subcoleções declaradas;
- segundo usuário não pode ler nem escrever dados do primeiro;
- acesso anônimo é negado;
- documento pai do usuário e coleções desconhecidas são negados;
- tipos, limites, campos extras e `schemaVersion` desconhecida são rejeitados;
- um batch inteiro falha quando contém uma série inválida.

## Comandos

Na pasta `mobile`:

```powershell
npm run typecheck
npm run test:unit
npm run test:rules
npm run test:all
```

## Critério de saída

- [x] regras versionadas;
- [x] testes das regras implementados;
- [x] índices versionados;
- [x] schemas e mapeadores implementados;
- [x] testes da fixture legada implementados;
- [x] ADRs registrados;
- [x] typecheck aprovado;
- [x] testes unitários aprovados: 25 testes;
- [x] testes no Emulator Suite aprovados: 21 testes.

Validação local total: 46 testes. O seed da fixture também foi executado duas vezes sobre o mesmo emulador, confirmando a idempotência dos IDs. A repetição no CI será adicionada com o pipeline da Fase 2.

## Auditoria de dependências

- dependências de produção: zero vulnerabilidades conhecidas em `npm audit --omit=dev`;
- dependências de desenvolvimento: cinco alertas moderados transitivos sob `firebase-tools`;
- o Firebase CLI é usado somente para tooling local/CI e não entra no bundle do aplicativo;
- a correção sugerida pelo npm aponta para downgrade do CLI e não foi aplicada automaticamente; os alertas devem ser reavaliados nas atualizações da Fase 2.

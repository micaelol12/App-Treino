# ADR 0005 — Usar catálogo de exercícios e divisões v2

- Status: Aceito
- Data: 17/08/2026

## Contexto

O contrato legado armazena `Divisao` e `Exercicio` como textos livres em
`usuarios/{uid}/config_treinos`. Isso não garante que um exercício exista no
catálogo e impede que divisões tenham ordem, estado e ciclo de vida próprios.

O catálogo global e suas taxonomias foram importados com IDs físicos automáticos
do Firestore. Cada documento de `exercicios` preserva o campo lógico `id` do JSON.

## Decisão

Adotar o contrato v2:

```text
exercicios/{exerciseDocumentId}
usuarios/{uid}/divisoes/{divisionId}
usuarios/{uid}/divisoes/{divisionId}/exercicios/{exerciseDocumentId}
```

Itens de plano armazenam `exerciseId`, `exerciseDocumentId` e
`exerciseNameSnapshot`. As regras verificam que o documento físico existe e que
seu campo `id` corresponde ao identificador lógico informado.

Divisões são documentos próprios com `name`, `order`, `active` e
`schemaVersion: 2`. Desativação é preferida a exclusão porque o Firestore não
remove subcoleções em cascata.

Novos registros de histórico armazenam `divisionId`, `exerciseId`,
`exerciseDocumentId` e snapshots, mantendo os campos legados para apresentação e
compatibilidade. Consultas usam IDs primeiro e nome como fallback.

A migração de `config_treinos` é idempotente e começa em dry-run. Nenhum dado é
gravado enquanto existirem nomes ambíguos ou não encontrados. Até o marcador
`usuarios/{uid}/migracoes/workout-plan-v2` ter status `complete`, o app combina a
leitura v2 com a leitura legada.

## Consequências

- novos planos só aceitam exercícios cadastrados;
- nomes duplicados no catálogo não criam ambiguidade de identidade;
- renomeações não alteram o significado do histórico;
- o app realiza uma leitura por divisão para carregar seus itens;
- catálogo e taxonomias são somente leitura para clientes autenticados;
- `config_treinos` permanece disponível durante o rollout e pode ser removido
  apenas em uma etapa posterior com backup.

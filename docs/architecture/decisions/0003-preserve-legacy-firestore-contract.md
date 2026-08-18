# ADR 0003 — Preservar o contrato Firestore legado na primeira versão

- Status: Superado parcialmente pelo ADR 0005; legado mantido durante a migração
- Data: 14/08/2026

## Contexto

O Streamlit e o app móvel precisam conviver durante a validação. As coleções existentes usam campos em português, incluindo campos acentuados, e não possuem versão, timestamps ou identificador de sessão.

Migrar todos os documentos antes de provar o app móvel aumentaria o risco de indisponibilidade e poderia quebrar o Streamlit.

## Decisão

Manter, na primeira versão, as coleções e campos físicos atuais:

- `usuarios/{uid}/config_treinos`;
- `usuarios/{uid}/historico_treinos`;
- `usuarios/{uid}/historico_pesos`.

DTOs legados existem somente na infraestrutura. Mapeadores os convertem para modelos com nomes em inglês. Documentos sem `Ordem` recebem fallback 99 no domínio.

Novas escritas continuam contendo os campos esperados pelo Streamlit e podem acrescentar metadados opcionais permitidos pelas regras: `schemaVersion`, `createdAt`, `updatedAt` e `sessionId` quando aplicável.

## Consequências

- não há migração destrutiva como pré-requisito do lançamento;
- Streamlit e mobile podem ler as mesmas coleções;
- acentos e nomes legados não vazam para domínio ou apresentação;
- regras precisam aceitar documentos antigos e novos durante a convivência;
- a validação de escrita não pode exigir metadados enquanto o Streamlit ainda escrever documentos legados;
- uma futura migração física deverá ser idempotente, testada e coberta por outro ADR.

## Alternativas rejeitadas

- migração big-bang antes do app: risco alto e rollback difícil;
- duplicar todas as coleções em `v2`: exige sincronização bidirecional durante a convivência;
- usar nomes legados em todo o código móvel: acoplamento permanente ao banco.

# ADR 0006 — usar cópia na seleção de divisões prontas

- Status: aceito
- Data: 24/08/2026

## Contexto

O aplicativo já mantém divisões e exercícios em coleções privadas por usuário. O
painel administrativo precisa publicar divisões prontas sem permitir que uma edição
global altere silenciosamente planos que os usuários já adotaram e personalizaram.

## Decisão

Os modelos globais ficam em `modelos_divisao/{templateId}` e seus exercícios em
`modelos_divisao/{templateId}/exercicios`. Eles possuem os estados `draft`,
`published` e `archived`; usuários autenticados leem apenas os publicados.

Ao selecionar um modelo, o aplicativo cria em um único batch uma nova divisão em
`usuarios/{uid}/divisoes` e copia os exercícios para sua subcoleção. A divisão passa
a pertencer integralmente ao usuário. `sourceTemplateId`, `sourceTemplateVersion` e
`importedAt` preservam a rastreabilidade, mas não criam sincronização com o modelo.

## Consequências

- edições e arquivamentos administrativos afetam somente novas importações;
- o plano existente nunca é substituído durante a seleção;
- nomes duplicados são rejeitados antes da cópia;
- uma falha no batch não deixa uma divisão parcialmente criada;
- modelos são limitados a 15 exercícios para respeitar, além do limite de operações,
  o limite de acessos a documentos realizados pelas regras em um batch do Firestore;
- novas consultas exigem o índice composto `status + displayOrder`.

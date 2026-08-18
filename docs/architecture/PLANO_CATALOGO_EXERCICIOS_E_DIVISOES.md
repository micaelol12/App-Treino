# Plano — catálogo de exercícios e divisões cadastradas

- Branch de planejamento: `codex/catalogo-exercicios-divisoes`
- Data da análise: 17/08/2026
- Escopo: substituir exercício e divisão em texto livre por entidades com IDs
  estáveis, preservando histórico e permitindo migração gradual.

## Diagnóstico do estado atual

O app lê e grava um documento por exercício em
`usuarios/{uid}/config_treinos`. Os campos físicos são `Divisao`, `Exercicio`,
`Series_Padrao` e `Ordem`; divisão e exercício são textos livres. A tela de
treino descobre as divisões extraindo valores distintos desses documentos. Isso
gera quatro problemas:

1. não existe integridade entre um item do treino e `exercicios`;
2. variações de nome criam divisões ou exercícios duplicados;
3. uma divisão não pode ter estado, ordem ou metadados próprios;
4. histórico e progresso identificam exercícios pelo nome.

O JSON analisado contém 873 exercícios, todos com `id` preenchido e sem IDs
duplicados. Existem quatro nomes duplicados, portanto o nome não pode ser chave:
`Afundo com Halteres`, `Arranco a Partir de Blocos`, `Corrida na Esteira` e
`Supino com Correntes`.

Na fixture legada do repositório, nenhum dos cinco nomes de exercício possui
correspondência exata no catálogo. Por exemplo, `Rosca Direta` aparece no
catálogo como `Rosca Direta com Barra`. A migração precisa produzir uma tabela de
correspondência e uma fila de revisão; não deve escolher por aproximação de forma
silenciosa.

## Modelo Firestore proposto

### Catálogo global

```text
exercicios/{exerciseDocumentId}
equipamentos/{equipmentId}
categorias/{categoryId}
forcas/{forceId}
niveis/{levelId}
mecanicas/{mechanicId}
musculos/{muscleId}
```

O upload realizado usa IDs físicos automáticos. O app preserva esse
`exerciseDocumentId` e também o campo lógico `exerciseId` do JSON. Os campos
taxonômicos atuais continuam como IDs escalares no documento (`equipment:
"halteres"`, por exemplo); não é necessário usar `DocumentReference`.

As coleções taxonômicas são globais, somente leitura para usuários autenticados
e escrita apenas por processo administrativo. O app deve considerar apenas
documentos com `active == true` em novos cadastros, mas continuar exibindo itens
inativos já referenciados.

### Configuração por usuário

```text
usuarios/{uid}/divisoes/{divisionId}
usuarios/{uid}/divisoes/{divisionId}/exercicios/{exerciseDocumentId}
```

Documento de divisão:

```json
{
  "name": "Push A",
  "order": 1,
  "active": true,
  "schemaVersion": 2,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

Item da divisão, usando o `exerciseDocumentId` físico como ID para impedir
duplicidade dentro da divisão:

```json
{
  "exerciseId": "Barbell_Bench_Press_-_Medium_Grip",
  "exerciseDocumentId": "ID_AUTOMATICO_DO_FIRESTORE",
  "exerciseNameSnapshot": "Supino Reto com Barra - Pegada Média",
  "defaultSets": 3,
  "order": 1,
  "active": true,
  "schemaVersion": 2,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

`exerciseId` é a identidade lógica e `exerciseDocumentId` permite que as regras
validem o documento físico. `exerciseNameSnapshot` melhora a leitura offline e
serve como fallback, mas não autoriza cadastrar texto livre. Exclusão
de divisão não possui cascata automática no Firestore: na primeira versão,
prefira desativação; uma exclusão definitiva deve apagar os itens em operação
administrativa/batch explícita.

### Sessão, histórico e progresso

Novas sessões devem carregar `divisionId` e, para cada exercício,
`exerciseId`. O histórico deve acrescentar IDs opcionais e manter snapshots:

- `divisionId` + `divisionNameSnapshot`;
- `exerciseId` + `exerciseNameSnapshot`.

Registros antigos continuam válidos somente com os campos de nome. Progresso e
histórico consultam primeiro por `exerciseId` e usam nome apenas como fallback
legado. Assim, renomear uma divisão ou exercício não reescreve o passado.

## Etapas de implementação

### 0. Preparar dados e contrato

- confirmar que todos os documentos de `exercicios` possuem `id` lógico único;
- importar as seis taxonomias em `firebase/import/exercise-taxonomies`;
- registrar o novo contrato em um ADR e elevar `schemaVersion` para 2;
- definir se a administração do catálogo ocorrerá fora do app ou por usuário
  com custom claim de administrador.

Critério de saída: IDs determinísticos, contagens do `manifest.json` conferidas e
nenhuma escrita de catálogo disponível para usuário comum.

### 1. Criar o módulo de catálogo

- adicionar modelos `Exercise` e taxonomias no domínio;
- criar `ExerciseCatalogRepository` e implementação Firestore;
- validar documentos com Zod e mapear falhas como nos repositórios atuais;
- cachear catálogo e filtros com TanStack Query;
- suportar busca por nome e filtros por músculo, equipamento, categoria, força,
  nível e mecânica.

Critério de saída: o app lista e pesquisa exercícios cadastrados, inclusive em
modo offline após o primeiro carregamento.

### 2. Tornar divisão uma entidade

- criar `WorkoutDivision`, regras de domínio, repositório e serviço próprios;
- implementar criar, renomear, reordenar, ativar/desativar e listar divisões;
- impedir nomes normalizados duplicados por usuário;
- trocar a derivação por `Set(exercise.division)` nas telas por consulta ao
  repositório de divisões.

Critério de saída: uma divisão existe e pode ser ordenada mesmo sem exercícios.

### 3. Referenciar exercícios no plano

- substituir `WorkoutExerciseDraft.division` e `.name` por `divisionId` e
  `exerciseId`;
- mover a persistência para a subcoleção da divisão;
- na tela, substituir inputs de texto por seletores de divisão e catálogo;
- validar no serviço e nas regras que a divisão pertence ao usuário e que
  `exercicios/{exerciseDocumentId}` existe e contém o `exerciseId` informado;
- manter séries e ordem como propriedades do item do plano.

Critério de saída: não é possível salvar um item apontando para divisão ou
exercício inexistente, nem repetir o exercício na mesma divisão.

### 4. Adaptar execução e histórico

- atualizar `WorkoutSessionDraft`, store ativo e conclusão da sessão para IDs;
- persistir IDs e snapshots nos novos registros de histórico;
- migrar consultas de histórico/progresso para `exerciseId`, com fallback por
  nome para documentos legados;
- adicionar os índices necessários somente depois de confirmar as consultas
  reais.

Critério de saída: sessões novas sobrevivem a renomeações e sessões antigas
continuam aparecendo.

### 5. Migrar `config_treinos`

Criar um script idempotente, executado primeiro no emulador, que:

1. lê `usuarios/{uid}/config_treinos` sem alterar a origem;
2. cria uma divisão por nome normalizado e preserva a ordem observada;
3. tenta correspondência de exercício por alias explícito e depois por nome
   normalizado somente quando houver exatamente um resultado;
4. grava itens resolvidos no modelo v2;
5. gera relatório `resolvidos`, `ambíguos` e `não encontrados`;
6. só marca o usuário como migrado quando não houver pendências.

Não remover `config_treinos` nessa etapa. Durante a transição, fazer leitura v2
com fallback legado por usuário. Escritas novas devem ir somente para v2 para
evitar sincronização bidirecional.

Critério de saída: segunda execução não cria duplicatas; todos os casos
ambíguos/não encontrados têm decisão registrada.

### 6. Regras, testes e rollout

- ampliar `firestore.rules` para catálogo somente leitura e divisões privadas;
- testar isolamento entre usuários, existência do exercício, campos permitidos,
  limites, timestamps e proibição de escrita global;
- criar fixtures v2 e testes de mapper, serviço, tela, sessão e migração;
- validar no Emulator Suite, depois em um usuário piloto e só então ampliar;
- monitorar documentos inválidos, referências ausentes e falhas de permissão.

Critério de saída: testes unitários e de regras passam; usuário piloto conclui e
consulta treinos novos e legados.

### 7. Encerrar legado

Após todos os usuários estarem migrados e um período de observação:

- remover o fallback de leitura de `config_treinos`;
- bloquear novas escritas legadas nas regras;
- exportar backup antes de arquivar/remover a coleção antiga;
- atualizar o ADR 0003 e a documentação operacional.

## Ordem recomendada de entregas

1. PR de dados, schemas, repositório de catálogo e regras de leitura;
2. PR de CRUD de divisões;
3. PR de seletor de exercício e persistência v2;
4. PR de sessão/histórico com IDs e compatibilidade legada;
5. PR do migrador, relatório e rollout;
6. PR posterior de remoção do legado.

Cada PR deve ser pequeno o suficiente para rollback independente. Nenhum deploy
ou remoção de dados de produção faz parte desta branch de planejamento.

## Riscos e controles

| Risco                                      | Controle                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| Upload de `exercicios` com IDs automáticos | salvar identidade lógica e `documentId` físico         |
| Nomes legados não batem com o catálogo     | aliases explícitos e revisão de não encontrados        |
| Nome duplicado no catálogo                 | usar sempre `exerciseId`, nunca nome como chave        |
| Exclusão de divisão deixa subcoleção órfã  | desativar por padrão; exclusão em batch explícito      |
| Renomeação altera histórico                | persistir ID e snapshot                                |
| Catálogo global editado por usuário comum  | regras de leitura autenticada e escrita administrativa |
| Migração parcial                           | marcador por usuário, relatório e script idempotente   |

## Definição de pronto

- todo item novo de treino referencia um documento existente em `exercicios`;
- toda divisão é um documento próprio, inclusive quando vazia;
- histórico novo contém IDs e snapshots; histórico antigo permanece legível;
- não existem inputs de texto livre para selecionar divisão ou exercício;
- regras e testes cobrem isolamento e integridade das novas coleções;
- migração é idempotente, auditável, reversível enquanto o legado existir;
- métricas do catálogo batem com o `manifest.json` gerado nesta branch.

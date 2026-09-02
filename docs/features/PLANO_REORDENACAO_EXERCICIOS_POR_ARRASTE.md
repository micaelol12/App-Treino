# Plano de feature — ordenação de divisões e exercícios por arraste

## 1. Objetivo

Simplificar a montagem do plano de treino:

- o cadastro de divisão deixa de pedir a ordem;
- toda divisão nova é inserida no fim do plano;
- o formulário de exercício deixa de pedir a ordem;
- todo exercício novo é inserido no fim da divisão selecionada;
- os botões **Subir** e **Descer** deixam de existir;
- a ordem passa a ser definida arrastando divisões e exercícios em suas listas;
- o campo `order` continua persistido no Firestore para manter o contrato atual e
  a ordenação das telas de treino.

## 2. Escopo funcional

### Divisões

1. Remover o campo visual **Ordem** do cadastro de divisão.
2. Ao salvar, calcular a próxima posição usando todas as divisões do usuário:
   `maior order + 1` (ou `1` quando ainda não houver divisão).
3. O usuário informa somente o nome; `active: true` e `order` são definidos pela
   aplicação na criação.
4. Substituir a lista estática de divisões por uma lista arrastável.
5. Ao soltar uma divisão, renumerar todas as divisões com posições contíguas a
   partir de `1` e persistir somente as ordens alteradas.
6. Permitir arrastar divisões ativas e inativas sem mudar o estado `active`.
7. Remover a exibição do número bruto de ordem dos cards e da descrição da tela de
   detalhes; a posição visual passa a representar a ordem.
8. Manter as ações **Editar**, **Desativar** e **Reativar** funcionando sem iniciar
   o gesto acidentalmente.

### Cadastro de exercício

1. Remover o campo visual **Ordem** do formulário de criação e da validação do
   formulário.
2. Ao salvar, calcular a próxima posição usando somente os exercícios da divisão
   escolhida: `maior order + 1` (ou `1` quando a divisão estiver vazia).
3. O usuário não envia nem escolhe `order`; essa responsabilidade fica na camada
   de aplicação.
4. Continuar bloqueando o cadastro duplicado do mesmo exercício dentro da mesma
   divisão.
5. Remover dos cards a exibição do número bruto de ordem; a posição visual da lista
   passa a representar a ordem.

### Edição

1. Remover o campo **Ordem** também da edição, pois a posição será controlada
   exclusivamente na lista.
2. Se a divisão não mudar, preservar a posição atual.
3. Se o exercício for transferido para outra divisão, inseri-lo no fim da divisão
   de destino.
4. Após mover entre divisões, opcionalmente normalizar a divisão de origem em uma
   operação separada; lacunas não afetam a ordenação, portanto essa normalização
   não deve bloquear a primeira entrega.

### Reordenação por arraste

1. Exibir um indicador de arraste em cada card e iniciar o gesto por pressão longa
   nesse indicador. Isso evita conflito com **Editar** e **Excluir**.
2. Durante o arraste, destacar o card ativo com elevação, borda e leve alteração de
   opacidade.
3. Ao soltar, renumerar a divisão com posições contíguas começando em `1` e salvar
   somente os itens cuja ordem mudou.
4. Aplicar a nova ordem imediatamente na interface; em caso de erro, restaurar a
   ordem anterior, exibir a mensagem existente e atualizar os dados do servidor.
5. Bloquear novo arraste e ações conflitantes enquanto a gravação estiver em
   andamento.
6. O arraste deve acontecer somente dentro da divisão aberta; não haverá arraste
   entre divisões nesta entrega.
7. Se a divisão contiver item legado (`sourceSchemaVersion < 2`), desabilitar a
   reordenação da divisão e orientar a migração, pois esses documentos não podem
   ser atualizados pelo repositório v2.

As mesmas regras de feedback visual, atualização otimista, rollback e bloqueio de
ações conflitantes se aplicam ao arraste das divisões.

## 3. Decisões técnicas

### Componente de lista

Usar uma lista própria para drag-and-drop baseada em
`react-native-draggable-flatlist`, instalada pela ferramenta compatível com Expo.
O projeto já possui `react-native-gesture-handler` e `react-native-reanimated`, que
são os principais pré-requisitos.

Como as telas atuais usam `Screen`, que contém um `ScrollView`, a implementação
deve evitar uma `FlatList` virtualizada comum aninhada. A opção prevista é:

- envolver a raiz do app em `GestureHandlerRootView`;
- usar `NestableScrollContainer` no contêiner da tela de detalhes;
- renderizar divisões e exercícios com `NestableDraggableFlatList`;
- manter cabeçalho, mensagens, gráfico muscular e demais ações no mesmo fluxo de
  rolagem.

Se a versão escolhida da biblioteca não suportar a combinação atual de Expo e
React Native, a alternativa é criar uma variante de `Screen` sem `ScrollView` e
usar uma única `DraggableFlatList`, levando cabeçalho e gráfico para
`ListHeaderComponent` e `ListFooterComponent`.

### Modelo e aplicação

Separar as entradas recebidas pela interface das entidades persistidas:

- `WorkoutDivisionInput`: nome e estado, sem `order`;
- `WorkoutDivisionDraft` (ou nome equivalente de persistência): mantém `order`;
- `WorkoutExerciseInput`: divisão, referência do catálogo e séries, sem `order`;
- `WorkoutExerciseDraft` (ou nome equivalente de persistência): inclui `order` e
  continua validando o limite `1..999`.

No `WorkoutDivisionService`:

- `create` valida nome e duplicidade, calcula a última posição e monta o draft
  persistido;
- `update` preserva a ordem atual ao renomear ou ativar/desativar;
- expor `reorder(orderedDivisionIds)` e validar que os IDs correspondem exatamente
  às divisões atuais antes de gerar as atualizações de ordem.

No `WorkoutPlanService`:

- `create` valida a entrada, lista os exercícios, impede duplicidade, calcula a
  última posição da divisão e só então monta o draft persistido;
- `update` preserva a ordem atual ou calcula a última posição da divisão de destino;
- substituir `move(exerciseId, direction)` por
  `reorder(divisionId, orderedExerciseIds)`;
- validar que os IDs recebidos pertencem à mesma divisão, são v2 e correspondem à
  lista completa reordenável antes de gerar `ExerciseOrderUpdate[]`.

No domínio, substituir `moveWorkoutExercise` por uma função pura que recebe a
sequência final e devolve apenas as ordens alteradas. `sortWorkoutExercises`
continua sendo a fonte de ordenação para leitura.

### Persistência e concorrência

Reutilizar `WorkoutPlanRepository.updateOrder`, que já grava várias posições em um
`writeBatch`, e adicionar a operação equivalente
`WorkoutDivisionRepository.updateOrder`. Não é necessária mudança de schema nem
migração do Firestore.

O cálculo `maior order + 1`, tanto para divisões quanto para exercícios, usa o
snapshot mais recente disponível na operação. Há uma pequena janela de concorrência
caso dois dispositivos adicionem ao mesmo tempo. Para esta entrega:

- após criar ou reordenar, invalidar e recarregar as queries de divisões e do plano;
- manter a validação e a mensagem de ordem duplicada como defesa interna;
- documentar uma evolução futura com contador transacional na divisão caso o uso
  simultâneo em múltiplos dispositivos se torne relevante, usando uma estratégia
  equivalente para a lista de divisões.

## 4. Alterações previstas por arquivo

### Apresentação

- `mobile/src/features/workout-divisions/presentation/components/workout-divisions-section.tsx`
  — remover estado e input de ordem, renderizar a lista arrastável, adicionar alça
  de arraste e preservar as ações existentes.
- `mobile/src/features/workout-divisions/presentation/workout-division-hooks.ts`
  — adicionar mutation `reorder`, atualização otimista das divisões e rollback,
  invalidando também o plano porque `divisionOrder` afeta sua ordenação.
- `mobile/src/features/workout-plans/presentation/screens/workout-division-details-screen.tsx`
  — retirar o número da ordem da descrição da divisão.
- `mobile/src/features/workout-plans/presentation/workout-exercise-form.schema.ts`
  — retirar `order` do formulário.
- `mobile/src/features/workout-plans/presentation/screens/workout-exercise-screen.tsx`
  — remover estado, referência, campo e conversão de ordem; ajustar a navegação do
  teclado.
- `mobile/src/features/workout-plans/presentation/components/workout-plans-section.tsx`
  — trocar o `map` de cards pela lista arrastável, remover **Subir/Descer**, adicionar
  alça de arraste e tratar `onDragEnd`.
- `mobile/src/features/workout-plans/presentation/workout-plan-hooks.ts`
  — trocar a mutation `move` por `reorder` e implementar atualização otimista com
  rollback.
- `mobile/src/features/workout-plans/presentation/workout-plan-error-message.ts`
  — manter erros de ordem como defesa interna e acrescentar erro específico para
  sequência inválida, se necessário.
- `mobile/src/app/_layout.tsx`
  — adicionar `GestureHandlerRootView` caso exigido pela lista escolhida.
- `mobile/src/shared/components/screen.tsx` ou
  `workout-division-details-screen.tsx` — adaptar o contêiner de rolagem para não
  aninhar listas virtualizadas.

### Domínio e aplicação

- `mobile/src/features/workout-divisions/domain/workout-division.ts` — separar o
  input sem ordem do draft persistido e criar a regra pura de reordenação.
- `mobile/src/features/workout-divisions/application/workout-division-service.ts`
  — calcular a última posição na criação, preservar posição em updates e expor
  `reorder`.
- `mobile/src/features/workout-divisions/application/workout-division-repository.ts`
  — adicionar `updateOrder` para gravação em lote.
- `mobile/src/features/workout-plans/domain/workout-plan-rules.ts` — separar input
  sem ordem do draft persistido e criar a regra de reordenação pela sequência final.
- `mobile/src/features/workout-plans/application/workout-plan-service.ts` — calcular
  a última posição em criação/mudança de divisão e expor `reorder`.
- `mobile/src/features/workout-plans/application/workout-plan-repository.ts` — manter
  `updateOrder`; ajustar apenas os tipos se a separação de input/draft exigir.

### Infraestrutura

- `mobile/src/features/workout-divisions/infrastructure/firestore/firebase-workout-division.repository.ts`
  — implementar a atualização das ordens das divisões em `writeBatch`.
- `mobile/src/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository.ts`
  — continuar persistindo `order` e usando batch na reordenação. Nenhuma alteração
  estrutural é esperada.
- `mobile/package.json` e `mobile/package-lock.json` — registrar a dependência de
  lista arrastável compatível com a versão atual do Expo.

## 5. Acessibilidade e UX

- Fornecer rótulos como “Arrastar divisão Push” e “Arrastar Supino reto”, informando
  a posição atual, por exemplo “posição 2 de 5”.
- Anunciar “Ordem atualizada” depois da persistência.
- Como os botões visuais serão removidos, expor ações de acessibilidade no card para
  “mover antes” e “mover depois”; isso mantém a funcionalidade disponível para quem
  não consegue executar o gesto de arraste.
- Respeitar áreas de toque mínimas e feedback tátil, quando disponível.
- Não usar apenas cor para indicar o card que está sendo movido.
- Manter **Editar** e **Excluir** utilizáveis sem iniciar o drag acidentalmente.
- Manter **Desativar** e **Reativar** utilizáveis nos cards de divisão sem iniciar o
  drag acidentalmente.

## 6. Testes

### Unidade — domínio e serviço

- criação da primeira divisão recebe ordem `1`;
- nova divisão recebe `maior order + 1`, inclusive quando existem lacunas;
- update de nome ou estado preserva a ordem atual da divisão;
- sequência de divisões gera ordens contíguas e rejeita IDs ausentes, repetidos ou
  desconhecidos;
- arraste de divisão sem mudança não chama `updateOrder`;
- criação em divisão vazia recebe ordem `1`;
- criação em divisão com ordens `1`, `2` e `5` recebe ordem `6`;
- exercícios de outras divisões não influenciam a nova posição;
- edição na mesma divisão preserva a ordem;
- edição para outra divisão recebe a última posição do destino;
- duplicidade de exercício continua bloqueada;
- sequência arrastada gera ordens contíguas e atualiza apenas itens alterados;
- sequência incompleta, com ID desconhecido, de outra divisão ou legado é rejeitada;
- arraste sem mudança não chama `updateOrder`.

### Componente e formulário

- o input `division-order-input` não é renderizado;
- o cadastro da divisão envia nome e estado, sem `order`;
- `onDragEnd` da lista de divisões chama `reorder` com a sequência final;
- divisões ativas e inativas são arrastáveis e preservam seu estado;
- editar, desativar e reativar continuam funcionando após a troca de lista;
- o input `workout-order-input` não é renderizado em criação nem edição;
- o payload enviado pela tela não contém `order`;
- os botões/test IDs de **Subir** e **Descer** não são renderizados;
- a lista mostra os exercícios na ordem recebida;
- `onDragEnd` chama `reorder` com divisão e sequência final;
- ações de editar/excluir continuam funcionando;
- estado pendente bloqueia outro gesto;
- falha de persistência restaura a ordem e mostra feedback;
- item legado desabilita o drag e mostra a orientação apropriada.

### Integração e regras

- testar no emulador Firestore o batch de reordenação das divisões;
- confirmar que uma divisão criada recebe o maior `order + 1`;
- confirmar que a nova ordem das divisões altera também a ordem de exibição dos
  grupos no plano e no início do treino;
- testar no emulador Firestore que um batch pode atualizar todas as ordens válidas;
- confirmar que um exercício criado recebe o maior `order + 1`;
- confirmar leitura na nova ordem após reabrir a tela;
- validar em Android e iOS o arraste em lista curta, lista maior que a tela e próximo
  às bordas, incluindo auto-scroll;
- verificar que pull-to-refresh, rolagem da tela e arraste não disputam o mesmo gesto.

## 7. Critérios de aceite

1. Não existe campo de ordem ao adicionar divisão nem ao adicionar ou editar
   exercício do plano.
2. Uma nova divisão sempre aparece no fim do plano.
3. Um novo exercício sempre aparece depois dos demais exercícios da sua divisão.
4. Não existem botões visuais **Subir** e **Descer**.
5. O usuário consegue pressionar, arrastar e soltar uma divisão ou um exercício em
   qualquer posição permitida da respectiva lista.
6. A ordem permanece correta após sair e voltar à tela ou abrir o app novamente.
7. Reordenar divisões não muda seu estado ativo/inativo nem a ordem interna de seus
   exercícios.
8. Reordenar exercícios não altera exercícios de outra divisão.
9. Em falha de rede, a interface não mantém silenciosamente uma ordem que não foi
   salva.
10. Edição, exclusão, ativação, gráfico muscular, atualização manual e execução do
    treino continuam funcionando.
11. A funcionalidade é operável com leitor de tela por ações de acessibilidade.

## 8. Sequência de implementação

1. Refatorar tipos e testes de divisões e exercícios para que a apresentação envie
   inputs sem `order`.
2. Implementar e testar a regra “inserir por último” nos dois serviços.
3. Criar a reordenação de divisões por sequência final e sua persistência em lote.
4. Substituir a regra de movimento unitário dos exercícios pela reordenação por
   sequência final.
5. Adicionar a infraestrutura de gestos e adaptar os contêineres de rolagem.
6. Implementar as duas listas arrastáveis, feedback visual, acessibilidade e rollback.
7. Atualizar testes de componente, integração Firestore e fluxos E2E.
8. Executar `npm run verify` e validar manualmente Android/iOS antes da entrega.

## 9. Fora de escopo

- arrastar exercícios entre divisões;
- alterar o schema dos documentos existentes;
- migrar automaticamente itens legados;
- sincronização colaborativa em tempo real entre dois dispositivos no mesmo plano.

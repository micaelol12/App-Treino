# Plano de feature — exercício equivalente no treino ativo

## 1. Objetivo

Durante um treino em andamento, permitir que o usuário encontre e escolha um
exercício que trabalhe musculatura semelhante à do exercício atual.

Na linha de ações do exercício, adicionar um ícone de troca entre os ícones de
**Instruções** (`?`) e **Histórico**. Ao tocar nele, abrir uma lista ranqueada de
exercícios equivalentes usando músculos principais e secundários do catálogo.

A substituição afeta somente a sessão ativa:

- não altera o plano de treino configurado;
- mantém a posição e a quantidade de séries do exercício atual;
- ao concluir, salva o histórico com ID, nome e documento do exercício realmente
  executado;
- permanece disponível depois de fechar e reabrir o app, porque o rascunho ativo
  já é persistido no `AsyncStorage`.

## 2. Escopo funcional

### Acesso e apresentação

1. Adicionar o botão **Exercício equivalente** entre
   `ExerciseInstructionsButton` e `ExerciseHistoryButton` no cabeçalho do
   exercício da tela de treino ativo.
2. Usar um ícone de troca, como `swap-horizontal-outline`, com a mesma área de
   toque de 48 × 48 dos botões existentes.
3. Abrir um modal com o título
   **Exercícios equivalentes a {nome do exercício}**.
4. Exibir no máximo os 10 candidatos mais próximos, já ordenados pelo algoritmo.
5. Em cada opção, mostrar:
   - nome do exercício;
   - músculos principais e secundários em comum;
   - equipamento, para ajudar o usuário a escolher uma alternativa viável;
   - ação **Substituir**.
6. Não mostrar o próprio exercício, exercícios inativos nem exercícios que já
   estejam presentes no mesmo treino ativo.
7. Tratar estados de carregamento, erro de catálogo, exercício atual não encontrado
   no catálogo e ausência de equivalentes.

### Substituição no treino ativo

1. Trocar no exercício atual os campos `exerciseId`, `exerciseDocumentId` e `name`.
2. Preservar `planExerciseId`, pois ele identifica a posição original do plano e
   compõe a chave determinística das séries da sessão.
3. Preservar a posição do exercício, o índice atual e a quantidade de séries.
4. Reinicializar os valores das séries para os padrões da sessão:
   `loadKg: '0'`, `repetitions: '0'`, `rpe: '8'` e `note: ''`.
5. Se alguma série tiver sido editada, pedir confirmação antes da troca e explicar
   que os valores daquele exercício serão limpos. Se estiver intacta, substituir
   diretamente.
6. Fechar o modal e anunciar que a substituição foi concluída.
7. Depois da troca, os botões de instruções, histórico e equivalência devem usar o
   novo exercício imediatamente.
8. Permitir uma nova substituição; nesse caso, o ranking parte do exercício que
   está atualmente no rascunho.

## 3. Algoritmo de equivalência

Implementar o ranking como função pura de domínio, sem consulta adicional ao
Firestore. O catálogo já carregado e armazenado localmente é suficiente.

### 3.1 Normalização

Para cada exercício, montar um mapa por ID de músculo:

- músculo principal: peso `3`;
- músculo secundário: peso `1`;
- se o mesmo ID aparecer nas duas listas, prevalece o peso principal;
- remover duplicatas antes do cálculo.

Os valores atuais já são IDs normalizados do catálogo, portanto não se deve
comparar os nomes traduzidos exibidos ao usuário.

### 3.2 Elegibilidade

Um candidato somente entra no ranking quando:

- `active !== false`;
- não é o exercício atual;
- não está em outra posição do treino ativo;
- compartilha pelo menos um músculo **principal com principal** com o exercício
  atual.

O último critério evita sugerir como substituto um exercício em que a musculatura
principal atual aparece apenas como auxiliar. No catálogo atual, todos os 1.324
exercícios importados possuem exatamente um músculo principal e cada grupo possui
ao menos duas opções, mas a implementação deve continuar funcionando com múltiplos
músculos principais no futuro.

### 3.3 Pontuação

Usar similaridade de Jaccard ponderada sobre a união dos músculos dos dois
exercícios:

```text
peso(exercício, músculo) = 3 se principal, 1 se secundário, 0 se ausente

similaridade =
  soma(min(peso_atual, peso_candidato))
  / soma(max(peso_atual, peso_candidato))
```

Consequências esperadas:

- correspondências entre músculos principais têm maior impacto;
- correspondências secundárias refinam a ordem entre exercícios do mesmo foco;
- um músculo que muda de principal para secundário ainda contribui, mas menos;
- músculos extras ou ausentes reduzem a similaridade.

Ordenar por:

1. maior similaridade;
2. maior quantidade de músculos principais coincidentes;
3. maior quantidade total de músculos coincidentes;
4. nome em ordem `pt-BR` e, por fim, `documentId`, para desempate estável.

Não exibir uma porcentagem ao usuário no MVP, pois ela sugere uma precisão clínica
que o catálogo não oferece. Mostrar os músculos coincidentes torna o motivo da
sugestão verificável.

### 3.4 Identidade e legado

Resolver o exercício atual nesta ordem:

1. `exerciseDocumentId`;
2. `exerciseId`;
3. nome exato, somente como compatibilidade com registros legados.

Usar `documentId` como identidade principal dos candidatos e `exerciseId` como
fallback ao excluir duplicados da sessão. Isso evita ambiguidades porque o catálogo
contém nomes repetidos.

## 4. Decisões técnicas

### Domínio

Criar `exercise-equivalence.ts` no domínio do catálogo com tipos e funções puras:

- `createMuscleWeightMap(exercise)`;
- `calculateExerciseSimilarity(source, candidate)`;
- `rankEquivalentExercises(source, candidates, options)`;
- resultado contendo o exercício, a pontuação interna e os IDs dos músculos em
  comum necessários para a interface.

Manter o algoritmo no domínio do catálogo permite reutilizá-lo futuramente na
configuração de planos ou em uma busca por alternativas, sem acoplar a regra à
tela de treino.

### Estado da sessão

Adicionar `replaceExercise(exerciseIndex, replacement)` ao
`active-workout.store.ts`. A ação deve atualizar o rascunho de forma atômica,
preservar `planExerciseId`, recriar as séries e não mexer no cronômetro nem no
índice atual.

Não é necessário alterar a forma persistida nem incrementar a versão do store: os
campos do `WorkoutExerciseDraft` continuam os mesmos.

### Interface

Criar um `EquivalentExerciseButton` responsável por:

- abrir e fechar o modal;
- ler o catálogo e os nomes das taxonomias via `useExerciseCatalogSnapshot()`;
- resolver o exercício atual;
- chamar a função pura de ranking;
- excluir os exercícios já presentes no rascunho;
- confirmar a perda de dados preenchidos;
- chamar `replaceExercise` com o candidato escolhido.

Como serão mostrados no máximo 10 itens, o modal pode usar o `ScrollView` já
fornecido por `InfoModal`, sem introduzir outra lista virtualizada. Se o limite for
removido no futuro, usar `InfoModal expanded` com `scrollable={false}` e uma
`FlatList`, seguindo o padrão do seletor do catálogo.

### Persistência e backend

Não são previstas mudanças em Firestore, regras, índices, importação ou painel
administrativo. O catálogo já contém `primaryMuscles`, `secondaryMuscles`,
`equipment` e `active`, e o fluxo de conclusão já persiste a identidade carregada
no rascunho.

## 5. Alterações previstas por arquivo

### Novos arquivos

- `mobile/src/features/exercise-catalog/domain/exercise-equivalence.ts` — cálculo,
  filtros e ordenação dos equivalentes.
- `mobile/src/features/exercise-catalog/domain/exercise-equivalence.test.ts` —
  testes unitários do algoritmo.
- `mobile/src/features/workout-session/presentation/components/equivalent-exercise-button.tsx`
  — botão, modal, estados e seleção.
- `mobile/src/features/workout-session/presentation/components/equivalent-exercise-button.test.tsx`
  — testes de interação do componente.

### Arquivos existentes

- `mobile/src/features/workout-session/presentation/screens/active-workout-screen.tsx`
  — inserir o novo botão entre ajuda e histórico e fornecer exercício atual,
  índice e identidades já usadas na sessão.
- `mobile/src/features/workout-session/presentation/active-workout.store.ts` —
  adicionar a ação atômica de substituição.
- `mobile/src/features/workout-session/presentation/active-workout.store.test.ts`
  — cobrir substituição, reset de séries e persistência.
- `mobile/src/features/workout-session/domain/workout-session-draft.ts` — criar,
  se útil, um tipo explícito para o payload de substituição; nenhuma mudança no
  formato persistido.
- `mobile/src/features/workout-session/domain/workout-session-rules.ts` — expor a
  criação dos valores padrão das séries ou uma função pura de substituição, para
  evitar duplicar os padrões no store.
- `mobile/src/features/workout-session/domain/workout-session-rules.test.ts` —
  testar a regra pura caso a substituição fique nesta camada.

## 6. UX e acessibilidade

- Rótulo: **Exercício equivalente para {nome}**.
- Dica: **Mostra exercícios que trabalham músculos semelhantes**.
- O modal deve anunciar carregamento, erro, resultado vazio e troca concluída.
- Cada candidato deve ter rótulo que inclua nome, músculos coincidentes e
  equipamento, sem depender somente de cor ou da posição no ranking.
- Manter a área mínima de toque de 48 × 48 e o estado pressionado usado pelos
  botões vizinhos.
- A confirmação de perda de dados deve oferecer **Cancelar** e
  **Substituir e limpar séries**, sem fechar o treino.
- Para o estado vazio, usar uma mensagem direta: **Nenhum exercício equivalente
  disponível**, explicando que exercícios inativos e os já usados no treino não
  aparecem.

## 7. Testes

### Algoritmo

- exclui o próprio exercício;
- exclui `active: false` e mantém `active` ausente ou verdadeiro;
- exclui candidato já presente no treino;
- exige ao menos uma correspondência principal–principal;
- atribui mais relevância a principal–principal do que a secundária–secundária;
- diferencia mudança de papel principal/secundário;
- penaliza músculos extras e ausentes pela união ponderada;
- remove músculos duplicados e prioriza o papel principal;
- ordena do maior para o menor score;
- desempata por músculos e depois por nome/documento de forma determinística;
- limita a 10 resultados;
- funciona com listas vazias e futuros exercícios com múltiplos músculos
  principais.

### Store e domínio da sessão

- substitui ID, documento e nome somente no índice solicitado;
- preserva `planExerciseId`, posição e quantidade de séries;
- reinicializa carga, repetições, RPE e observação;
- não altera os demais exercícios, o índice atual nem o cronômetro;
- persiste o exercício substituto no `AsyncStorage`;
- restaura corretamente a troca após reidratação;
- conclusão da sessão gera registros com a identidade e o nome do substituto.

### Componente e tela

- renderiza o novo ícone entre instruções e histórico;
- abre e fecha o modal;
- mostra carregamento, falha, exercício sem catálogo e lista vazia;
- apresenta candidatos na ordem calculada e seus dados explicativos;
- não pede confirmação quando as séries estão intactas;
- pede confirmação quando há qualquer valor editado;
- cancelar mantém o exercício e os valores;
- confirmar troca, limpa as séries, fecha o modal e atualiza título e demais ações;
- os test IDs de instruções e histórico passam a refletir o substituto;
- rótulos e anúncios de acessibilidade estão presentes.

### Validação manual

- testar em Android e iOS com catálogo disponível localmente e após sincronização;
- trocar antes e depois de preencher uma série;
- fechar e reabrir o app durante o treino e confirmar a restauração;
- concluir o treino e verificar o substituto no histórico;
- confirmar que o plano original continua inalterado;
- validar cabeçalho com nome longo e três ícones em telas estreitas.

## 8. Critérios de aceite

1. Durante o treino ativo existe um ícone de exercício equivalente ao lado dos
   ícones de instruções e histórico.
2. A lista contém somente exercícios ativos, diferentes do atual, ainda não usados
   na sessão e com músculo principal em comum.
3. A ordem considera músculos principais com peso 3 e secundários com peso 1,
   usando a similaridade ponderada definida neste plano.
4. O usuário consegue entender a sugestão pelos músculos coincidentes e pelo
   equipamento exibido.
5. A troca altera apenas o treino em andamento e não modifica o plano cadastrado.
6. Valores já preenchidos nunca são descartados sem confirmação.
7. Após a troca, instruções, histórico, nova busca de equivalentes e conclusão do
   treino usam o exercício substituto.
8. O exercício realmente executado aparece corretamente no histórico.
9. A troca sobrevive à reabertura do app durante a sessão.
10. Carregamento, erro, ausência de dados e acessibilidade possuem feedback claro.
11. `npm run verify` passa e o fluxo é validado manualmente em Android e iOS.

## 9. Sequência de implementação

1. Implementar e testar a identidade, o filtro e o ranking puro de equivalência.
2. Implementar e testar a regra de substituição e o reset seguro das séries.
3. Expor a ação no store persistido e cobrir reidratação.
4. Criar o botão e o modal com os estados de catálogo e lista de candidatos.
5. Integrar o botão ao cabeçalho do treino ativo e revisar o layout estreito.
6. Cobrir confirmação, atualização das ações e histórico do substituto.
7. Executar `npm run verify` e a validação manual em dispositivos.

## 10. Fora de escopo

- alterar permanentemente o plano ao fazer uma substituição;
- recomendar por lesões, limitações médicas, biomecânica ou nível de segurança;
- personalização do ranking por preferência, academia ou equipamento disponível;
- aprendizado baseado nas escolhas anteriores do usuário;
- sincronizar a troca do rascunho entre dispositivos;
- permitir escolher qualquer exercício fora do conjunto ranqueado;
- mudanças no painel administrativo ou no schema do catálogo.

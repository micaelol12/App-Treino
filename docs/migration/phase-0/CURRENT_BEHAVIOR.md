# Comportamento atual

## Convenções

- **Manter**: comportamento que compõe a paridade funcional.
- **Melhorar**: intenção funcional válida, com UX ou robustez insuficiente.
- **Não reproduzir**: falha ou risco que deve ser corrigido na reescrita.

## Autenticação

### AUTH-01 — Entrar

- Caso feliz: usuário informa e-mail e senha; o app chama Firebase Authentication e abre as cinco abas.
- Validação: campos vazios exibem aviso.
- Erro: a mensagem retornada pelo Firebase é exibida quase sem tradução.
- Estado persistido: o UID é salvo por 30 dias em cookie.
- Classificação: **manter o fluxo; não reproduzir a implementação da sessão**.

O cookie atual contém somente um UID e é aceito como identidade. Como o backend usa Firebase Admin SDK, uma identidade adulterada pode alcançar um caminho de outro usuário. O app móvel deve restaurar uma sessão autenticada e validada pelo Firebase, nunca confiar em um UID local.

### AUTH-02 — Criar conta

- Caso feliz: cria conta com e-mail e senha e entra automaticamente.
- Validações: campos obrigatórios, senhas iguais e mínimo de seis caracteres.
- Erros: cadastro existente, senha inválida ou falha de rede aparecem a partir da resposta Firebase.
- Classificação: **manter e melhorar mensagens/validação**.

### AUTH-03 — Sair

- Caso feliz: limpa UID da memória e remove cookie.
- Classificação: **manter**, invalidando somente o estado local da sessão Firebase.

### Estados ausentes

- redefinição de senha;
- exclusão de conta;
- verificação de e-mail;
- estado de carregamento explícito durante restauração da sessão.

Os dois primeiros são obrigatórios na versão móvel; verificação de e-mail fica fora da paridade inicial, salvo decisão posterior.

## Configuração de treinos

### PLAN-01 — Listar estrutura

- Lê `config_treinos` e mostra divisão, exercício, séries padrão e ordem.
- A tabela é ordenada por divisão e ordem.
- Quando não há dados, mostra estado vazio.
- Classificação: **manter**.

### PLAN-02 — Adicionar exercício

- Exige divisão e exercício não vazios.
- Séries padrão: 1 a 10, valor inicial 3.
- Ordem: mínimo 1, valor inicial 1.
- Não impede nomes duplicados ou ordens repetidas.
- Classificação: **manter e melhorar validação**.

### PLAN-03 — Excluir exercício

- Seleciona pelo nome e remove todos os documentos com `Exercicio` igual.
- Dois exercícios homônimos, mesmo em divisões diferentes, podem ser removidos juntos.
- Não solicita confirmação.
- Classificação: **não reproduzir**. Excluir por ID, mostrando divisão e nome, com confirmação.

### PLAN-04 — Editar e reordenar

- Não existe no app atual.
- Classificação: **melhoria já aprovada pelo plano**, necessária para uma experiência móvel completa.

## Treino ativo

### ACTIVE-01 — Selecionar treino

- Se não houver configuração, orienta o usuário a cadastrar exercícios.
- Data inicial: hoje.
- Divisão inicial: primeira divisão retornada.
- Exercícios são ordenados por `Ordem`; ausente ou inválida recebe posição 99.
- Classificação: **manter**.

### ACTIVE-02 — Preencher séries

- Cada série possui carga, repetições, RPE e observação.
- Valores iniciais: carga 0, repetições 0, RPE 8 e observação vazia.
- Limites: carga e repetições não negativas; RPE entre 1 e 10.
- Anterior/próximo preservam dados apenas na memória do processo.
- Exibe progresso e posição do exercício.
- Classificação: **manter e adicionar persistência local**.

### ACTIVE-03 — Concluir treino

- Inclui somente séries com pelo menos uma repetição.
- Grava todas as séries incluídas usando batch do Firestore.
- Exibe sucesso se houver registros.
- Se todas as repetições forem zero, encerra silenciosamente sem gravar.
- Não há proteção visível contra toque duplo ou erro parcial de UX.
- Classificação: **manter filtro e batch; melhorar validação e idempotência**.

### ACTIVE-04 — Abortar treino

- Limpa imediatamente todo o estado em memória.
- O botão informa que os dados serão perdidos, mas não solicita confirmação.
- Classificação: **manter a ação e exigir confirmação**.

### Estados de erro ausentes

- falha ao carregar configuração;
- perda de rede durante o treino;
- falha no batch final;
- fechamento/reinício do app;
- documento legado inválido.

## Registro manual

### MANUAL-01 — Montar formulário

- Seleciona data e divisão e mostra todas as séries de todos os exercícios.
- Usa os mesmos campos e valores iniciais do treino ativo.
- Se não houver configuração, mostra estado vazio orientativo.
- A extração não ordena explicitamente por `Ordem`, ao contrário do treino ativo.
- Classificação: **manter e corrigir a ordem**.

### MANUAL-02 — Salvar

- Inclui somente séries com repetições maiores que zero.
- Usa batch do Firestore e exibe sucesso.
- Envio sem séries válidas não mostra feedback.
- Classificação: **manter e melhorar feedback/idempotência**.

## Evolução

### PROGRESS-01 — Filtrar exercício

- Carrega todo `historico_treinos` e permite escolher um exercício existente.
- Sem histórico, exibe estado vazio.
- Não há período, paginação ou atualização manual.
- Classificação: **manter o filtro; melhorar a consulta**.

### PROGRESS-02 — Força máxima estimada

- Converte data, carga e repetições.
- Calcula `1RM = carga * (1 + repetições / 30)` para cada série.
- Agrupa por data e mostra maior carga e maior 1RM.
- Classificação: **manter exatamente a fórmula até decisão de produto posterior**.

### PROGRESS-03 — Volume

- Calcula `volume = carga * repetições` por série.
- Soma o volume por data e mostra gráfico de barras.
- Classificação: **manter**.

### Estados de erro ausentes

- valor não numérico ou data inválida;
- documentos parcialmente preenchidos;
- grande volume de histórico;
- falha na renderização dos gráficos.

## Peso

### WEIGHT-01 — Registrar peso

- Data inicial: hoje.
- Peso mínimo: 30 kg; valor inicial 75 kg; passo de 0,1 kg.
- Cada envio cria novo documento, mesmo que já exista pesagem na data.
- Classificação: **manter registro; mudar para upsert por data**.

### WEIGHT-02 — Visualizar tendência

- Carrega todo `historico_pesos`.
- Ordena por data e mantém um único registro quando a data está duplicada.
- Calcula média móvel dos últimos sete registros, com `min_periods=1`.
- Mostra pontos diários e linha de tendência.
- Classificação: **manter o cálculo por sete registros e documentá-lo assim**. Ele não representa sete dias corridos quando existem dias sem pesagem.

## Comportamentos transversais

### DATA-01 — Escopo dos dados

- Todos os dados ficam abaixo de `usuarios/{uid}`.
- A aplicação não pagina nenhuma coleção.
- Datas são strings `YYYY-MM-DD`.
- Não existem `createdAt`, `updatedAt`, `schemaVersion` ou `sessionId`.
- Classificação: **preservar leitura legada e melhorar novas escritas**.

### UX-01 — Feedback

- Há mensagens de sucesso, aviso, vazio e alguns erros.
- Operações bloqueiam o rerun do Streamlit e não apresentam skeleton/loading próprio.
- Erros de banco não são tratados de forma consistente.
- Classificação: **manter a intenção e padronizar estados**.

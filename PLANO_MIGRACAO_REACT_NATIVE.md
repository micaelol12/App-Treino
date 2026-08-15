# Plano de reescrita para React Native

## 1. Objetivo

Reescrever o aplicativo em React Native, preservando as funcionalidades e os dados do Firebase, com uma base sustentável para Android e iOS. Por decisão registrada no ADR 0004, o código Streamlit foi retirado após a fundação móvel; a paridade passa a ser verificada pelas fixtures, pelos testes de contrato e pelo baseline histórico da fase 0.

O plano privilegia Clean Code de forma pragmática: regras de negócio independentes da interface e do Firebase, módulos organizados por funcionalidade, tipos explícitos, testes nas áreas de maior risco e abstrações apenas quando houver uma responsabilidade real a separar.

## 2. Escopo atual identificado

O aplicativo existente possui os seguintes fluxos:

- autenticação por e-mail e senha e criação de conta;
- criação e exclusão de exercícios, com divisão, número de séries e ordem;
- execução guiada de um treino, exercício por exercício;
- registro completo/manual de uma sessão;
- histórico e análise de carga máxima, 1RM estimada e volume;
- registro de peso e média móvel de sete dias;
- persistência no Firebase Authentication e Cloud Firestore.

Coleções atuais, todas abaixo de `usuarios/{uid}`:

- `config_treinos`;
- `historico_treinos`;
- `historico_pesos`.

## 3. Decisões técnicas propostas

### Base do aplicativo

- React Native com Expo e TypeScript em modo estrito.
- Expo Router para rotas tipadas, pilhas de autenticação e navegação por abas.
- Development Build desde o início do projeto, aproximando o ambiente de desenvolvimento do binário publicado.
- Firebase JS SDK para Authentication e Firestore na primeira versão, pois atende ao escopo atual e preserva a possibilidade de executar o app também na web. O acesso ficará atrás de interfaces de repositório, permitindo trocar para React Native Firebase sem alterar regras de negócio caso surjam requisitos nativos como Crashlytics, Analytics ou App Check.
- TanStack Query para estado remoto, cache, invalidação, paginação e estados de carregamento/erro.
- Zustand somente para o rascunho da sessão ativa e preferências locais; dados do Firestore não devem ser duplicados no store global.
- React Hook Form e Zod para formulários e validação na fronteira da aplicação.
- AsyncStorage para manter o rascunho de treino ativo e restaurá-lo após fechamento ou falha do app.
- `date-fns` para datas, armazenando instantes no Firestore como `Timestamp` e usando `YYYY-MM-DD` apenas para datas civis, como o dia da pesagem.
- Jest, React Native Testing Library, Firebase Emulator Suite e Maestro para testes unitários, de componentes, de integração e ponta a ponta.

As versões devem ser as estáveis e compatíveis no início da implementação, instaladas com `npx expo install` quando aplicável e fixadas no lockfile. Não se deve copiar números de versão deste documento.

### Navegação proposta

```text
(auth)
  login
  cadastro
(app)
  (tabs)
    treino
    registro
    evolucao
    peso
    configuracoes
  treino/ativo
  configuracoes/exercicio/[id]
```

O layout raiz observa o estado real do Firebase Authentication. Usuários sem sessão acessam somente o grupo de autenticação; usuários autenticados acessam o aplicativo. Nenhum UID armazenado localmente deve ser aceito como prova de autenticação.

## 4. Arquitetura alvo

Usar organização por funcionalidade, mantendo as dependências apontadas para o domínio:

```text
src/
  app/                         # rotas e layouts; sem regra de negócio
  features/
    auth/
      domain/
      application/
      infrastructure/
      presentation/
    workout-plans/
      domain/
      application/
      infrastructure/
      presentation/
    workout-session/
      domain/
      application/
      infrastructure/
      presentation/
    progress/
      domain/
      application/
      infrastructure/
      presentation/
    weight/
      domain/
      application/
      infrastructure/
      presentation/
  shared/
    components/                # componentes visuais reutilizáveis
    design-system/             # cores, tipografia, espaçamento e tema
    errors/                    # erros conhecidos da aplicação
    firebase/                  # inicialização e composição
    validation/
    testing/
```

Responsabilidades:

- `domain`: entidades, value objects e cálculos puros, sem React, Expo ou Firebase;
- `application`: casos de uso e contratos de repositório;
- `infrastructure`: implementação Firebase, DTOs e mapeadores;
- `presentation`: telas, componentes, hooks e adaptação de eventos de UI;
- `app`: composição de dependências, providers e rotas.

Fluxo permitido de dependências:

```text
presentation -> application -> domain
infrastructure -> application/domain
app -> todos, apenas para composição
```

O domínio não pode importar módulos da infraestrutura ou da apresentação.

### Modelo de domínio

Entidades iniciais:

- `WorkoutPlan`: divisão e exercícios ordenados;
- `Exercise`: identificador, nome, séries padrão e posição;
- `WorkoutSession`: data, divisão, status e séries executadas;
- `WorkoutSet`: exercício, número, carga, repetições, RPE e observação;
- `WeightEntry`: data civil e peso em quilogramas.

Regras que devem ser funções puras ou value objects:

- `repetitions >= 0`;
- `loadKg >= 0`;
- `rpe` entre 1 e 10;
- `defaultSets` entre 1 e 10;
- cálculo de volume: `loadKg * repetitions`;
- cálculo de 1RM estimada pela fórmula atualmente usada;
- média móvel de sete registros/dias, com comportamento documentado para dias ausentes;
- somente séries com pelo menos uma repetição entram no histórico.

## 5. Estratégia de dados e compatibilidade

### Primeira versão: compatibilidade sem migração destrutiva

A primeira entrega deve continuar lendo as coleções atuais. DTOs Firebase ficam restritos à infraestrutura e são convertidos para nomes consistentes em inglês no domínio:

```text
Firestore "Exercício" -> domain exerciseName
Firestore "Carga"     -> domain loadKg
Firestore "Reps"      -> domain repetitions
Firestore "Data"      -> domain performedOn
```

Isso evita espalhar acentos, convenções legadas e detalhes do banco pela aplicação. O mapeador deve tolerar documentos antigos sem `Ordem`, usando a mesma regra atual de colocá-los ao final.

Novos documentos recebem:

- `schemaVersion`;
- `createdAt` e `updatedAt` com horário do servidor;
- `sessionId` nos registros de séries de uma mesma sessão;
- valores normalizados e validados antes da escrita.

### Correções de modelo incluídas

- Excluir exercícios por ID do documento, e não pelo nome. Hoje nomes iguais em divisões diferentes podem ser excluídos juntos.
- Usar uma operação atômica em lote para concluir o treino.
- Atribuir à sessão um `sessionId`, permitindo rastrear e futuramente editar ou excluir uma sessão completa.
- Gravar peso novo com ID determinístico por usuário e data (`YYYY-MM-DD`) para funcionar como upsert. O leitor continua aceitando os documentos legados com IDs aleatórios.
- Consultar históricos ordenados e paginados; nunca carregar uma coleção inteira indefinidamente.
- Criar e versionar os índices compostos exigidos pelas consultas.

Uma migração física para nomes de campos novos deve ser um projeto posterior, com script idempotente, backup/exportação, execução em ambiente de homologação e relatório de documentos convertidos. Ela não é requisito para lançar a primeira versão móvel.

### Segurança obrigatória

O Streamlit usa o Firebase Admin SDK, que ignora as Security Rules. O app móvel acessará o Firestore como cliente e, portanto, as regras precisam estar prontas antes dos primeiros testes com dados reais.

Requisitos mínimos:

- permitir leitura e escrita apenas quando `request.auth.uid == uid` do caminho `usuarios/{uid}`;
- negar por padrão todo caminho não declarado;
- validar campos obrigatórios, tipos e limites nas escritas;
- testar regras no Firebase Emulator Suite, inclusive tentativas de acesso cruzado entre usuários;
- separar projetos/configurações de desenvolvimento, homologação e produção;
- não incluir credenciais do Admin SDK no aplicativo;
- tratar a configuração pública do cliente Firebase como configuração, não como segredo, e proteger os dados com Authentication, Security Rules e restrições de chave adequadas.

## 6. Padrões de Clean Code

- TypeScript com `strict`, sem `any` implícito e sem assertions usadas para esconder tipos incorretos.
- Nomes de código em inglês e textos da interface em arquivos de tradução pt-BR.
- Um componente ou caso de uso deve ter uma responsabilidade clara e uma API pequena.
- Regra de negócio não fica em tela, hook de consulta, callback de botão ou mapper Firebase.
- Componentes de tela orquestram; componentes visuais recebem dados e callbacks por props.
- Não criar `utils.ts` genérico. Funções ficam no módulo que expressa sua intenção.
- Não retornar erros Firebase diretamente para a UI. Mapear para erros conhecidos, como `InvalidCredentials`, `PermissionDenied`, `NetworkUnavailable` e `ValidationError`.
- Não acessar Firebase diretamente dentro de componentes React.
- Evitar abstrações especulativas. Criar interface quando houver uma fronteira real: banco, armazenamento local, relógio, geração de ID ou telemetria.
- Preferir composição a herança e funções puras para cálculos.
- Usar tokens do design system; evitar cores, tamanhos e espaçamentos mágicos nas telas.
- Toda lista deve ter estados de carregamento, vazio, erro, atualização e paginação.
- Toda ação destrutiva deve ter confirmação e feedback de sucesso/falha.

Automação de qualidade:

- ESLint com regras para TypeScript, hooks e imports;
- Prettier;
- verificação de tipos, lint e testes em cada pull request;
- commits pequenos por funcionalidade e revisão obrigatória para mudanças em regras de segurança ou modelo de dados;
- cobertura mínima de 80% em `domain` e `application`, sem usar cobertura global como substituto para bons cenários.

## 7. Plano de execução

### Fase 0 — Baseline e decisões de produto

Status: **executada em 14/08/2026; aprovação de produto e confirmação dos projetos Firebase pendentes**. Artefatos em `docs/migration/phase-0/`.

Entregas:

- documentar os fluxos atuais com casos felizes, estados vazios e erros;
- criar uma pequena massa anônima de homologação;
- confirmar se a primeira versão será Android e iOS, e se web é requisito;
- definir identidade visual, acessibilidade mínima e matriz de dispositivos;
- registrar métricas de aceitação e política de retenção/exclusão de conta.

Critério de saída: checklist de paridade aprovado e ambientes Firebase definidos.

### Fase 1 — Segurança e contrato de dados

Status: **concluída e validada localmente em 14/08/2026 (46 testes aprovados)**. Artefatos em `firebase/`, `mobile/` e `docs/migration/phase-1/`.

Entregas:

- regras do Firestore versionadas no repositório;
- testes automatizados das regras no Emulator Suite;
- índices versionados;
- schemas Zod para os documentos atuais;
- mapeadores legado/domínio com testes;
- ADRs curtos para Expo, Firebase SDK e estratégia de compatibilidade.

Critério de saída: um usuário autenticado acessa somente seus dados e documentos legados válidos são convertidos sem erro.

### Fase 2 — Fundação React Native

Status em 14/08/2026: fundação e pipeline concluídos localmente. Os perfis de
Development Build estão prontos; a geração dos binários depende apenas de vincular
o repositório a uma conta/projeto EAS.

Entregas:

- projeto Expo TypeScript e Expo Router;
- configurações de desenvolvimento, homologação e produção;
- estrutura por features e regras de importação;
- tema, componentes básicos e tratamento global de erros;
- TanStack Query, formulários, validação e stores configurados;
- pipeline com typecheck, lint e testes;
- Development Builds Android e iOS instaláveis.

Critério de saída: shell do app navega, alterna tema se previsto e passa pelo pipeline sem avisos.

### Fase 3 — Autenticação

Status em 15/08/2026: implementação concluída localmente com Firebase Auth,
persistência em AsyncStorage, proteção de rotas, mensagens seguras e fluxo E2E
versionado. A validação contra o projeto real depende da confirmação das
configurações públicas e da habilitação do provedor E-mail/senha no Firebase.

Entregas:

- login, cadastro, logout e restauração segura da sessão;
- redefinição de senha e mensagens de erro compreensíveis;
- proteção das rotas autenticadas;
- testes unitários, de componente e E2E do fluxo principal.

Critério de saída: reiniciar o app mantém uma sessão válida, logout remove o acesso e um UID local adulterado não concede acesso.

### Fase 4 — Configuração de treinos

Entregas:

- listar planos e exercícios em ordem;
- adicionar, editar, reordenar e excluir por ID;
- validação de duplicidade e limites;
- estados vazio, erro e carregamento;
- compatibilidade com documentos sem `Ordem`.

Critério de saída: as mudanças preservam o contrato legado validado pelas fixtures e aparecem corretamente no app móvel e no Firestore Emulator.

### Fase 5 — Treino ativo

Entregas:

- seleção de data e divisão;
- navegação entre exercícios e edição das séries;
- progresso, anterior, próximo, concluir e abortar;
- salvamento automático do rascunho local;
- restauração do treino após fechamento do app;
- conclusão idempotente e em lote, evitando registros duplicados por toque repetido;
- confirmação explícita antes de descartar um treino.

Critério de saída: todos os dados digitados sobrevivem à navegação e ao reinício; a conclusão cria exatamente uma sessão lógica.

### Fase 6 — Registro manual

Entregas:

- formulário completo por divisão;
- uso dos mesmos componentes de série e dos mesmos casos de uso do treino ativo;
- validação e gravação atômica;
- proteção contra envio duplicado.

Critério de saída: o histórico gerado é equivalente ao do fluxo atual e aparece nas análises.

### Fase 7 — Peso e evolução

Entregas:

- registro/upsert de peso por data;
- histórico paginado de peso;
- gráfico de valores e tendência de sete dias;
- filtro por exercício;
- gráficos de carga máxima, 1RM estimada e volume por sessão/data;
- spike técnico curto para validar desempenho, acessibilidade e compatibilidade da biblioteca de gráficos antes de adotá-la.

Critério de saída: cálculos batem com fixtures conhecidas e gráficos continuam utilizáveis em telas pequenas, modo escuro e com datasets maiores.

### Fase 8 — Hardening, beta e corte

Entregas:

- testes E2E dos caminhos críticos em Android e iOS;
- acessibilidade: labels, foco, contraste, tamanho de toque e fonte ampliada;
- testes de rede lenta, offline, retomada e falhas do Firebase;
- telemetria de erros sem dados sensíveis;
- política de privacidade, exclusão de conta e requisitos das lojas;
- distribuição interna, beta controlado e checklist de rollback;
- monitoramento de erros ao ler documentos legados e checklist de rollback.

Critério de saída: zero defeito bloqueador, regras auditadas, recuperação validada e aprovação do checklist de paridade.

## 8. Estratégia de testes

### Unitários

- validação de séries e exercícios;
- volume, 1RM e média móvel;
- ordenação e fallback de `Ordem`;
- mapeamento dos campos legados;
- filtragem de séries com zero repetição;
- casos de uso com repositórios falsos.

### Integração

- CRUD dos três repositórios contra o Firebase Emulator;
- lotes, timestamps, paginação e idempotência;
- regras de segurança para dono, outro usuário e usuário anônimo;
- leitura de documentos legados incompletos e rejeição segura de documentos inválidos.

### Componentes

- formulários e mensagens de validação;
- estados vazio, carregando, erro e sucesso;
- navegação anterior/próximo sem perda do rascunho;
- confirmação de ações destrutivas.

### Ponta a ponta

1. criar conta e entrar;
2. cadastrar e ordenar exercícios;
3. iniciar, interromper, restaurar e concluir treino;
4. verificar os indicadores de evolução;
5. registrar peso e verificar a tendência;
6. sair e confirmar bloqueio das rotas privadas.

## 9. Ordem de entrega e estimativa

Para uma pessoa desenvolvedora com experiência em React Native, a estimativa inicial é de 6 a 9 semanas:

- baseline, segurança e fundação: 1,5 a 2 semanas;
- autenticação e configuração: 1 a 1,5 semana;
- treino ativo e registro manual: 2 a 2,5 semanas;
- peso, evolução e gráficos: 1 a 1,5 semana;
- hardening, beta e publicação: 1 a 1,5 semana.

A estimativa deve ser recalibrada após a Fase 1. Publicação nas lojas, identidade visual ainda não definida, migração física de dados, modo offline completo e novas funcionalidades não estão incluídos automaticamente.

## 10. Definition of Done global

Uma funcionalidade só está concluída quando:

- atende aos critérios de aceitação e à paridade definida;
- possui estados de carregamento, vazio, erro e sucesso quando aplicáveis;
- não contém regra de negócio na camada de apresentação;
- passa por typecheck, lint e testes automatizados;
- inclui testes nos cálculos, mapeamentos e caminhos de falha relevantes;
- funciona em Android e iOS nos dispositivos da matriz;
- respeita acessibilidade e não registra credenciais ou dados sensíveis;
- mantém compatibilidade documentada com os dados existentes;
- atualiza documentação ou ADR quando altera arquitetura, segurança ou contrato de dados.

## 11. Riscos principais e mitigação

| Risco                                                               | Mitigação                                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Security Rules ausentes ou permissivas                              | Implementar e testar no Emulator antes de usar dados reais                               |
| Campos legados inconsistentes                                       | Validadores e mapeadores tolerantes, com telemetria de documentos rejeitados             |
| Histórico crescendo sem limite                                      | Consultas por intervalo, ordenação, índices e paginação por cursor                       |
| Perda do treino em andamento                                        | Rascunho persistido a cada alteração e restauração testada                               |
| Duplicidade por reenvio                                             | ID de sessão gerado antes do commit e operação idempotente                               |
| Regressão na leitura dos dados legados após a retirada do Streamlit | Fixtures versionadas, mapeadores tolerantes e testes de contrato no Emulator             |
| Biblioteca de gráficos inadequada                                   | Spike na Fase 7 antes de acoplar componentes de produção                                 |
| Arquitetura excessiva para o tamanho do app                         | Interfaces somente nas fronteiras e módulos criados conforme as features forem entregues |

## 12. Próximo marco recomendado

Executar a Fase 4 como próximo corte vertical: provar a leitura autenticada de um plano legado no Firestore Emulator, implementar listagem com estados de carregamento, vazio e erro e então avançar para criação, edição, reordenação e exclusão por ID.

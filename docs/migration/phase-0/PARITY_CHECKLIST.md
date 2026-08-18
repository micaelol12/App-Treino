# Checklist de paridade

Este checklist é o contrato de aceite da primeira versão móvel. Marcar um item somente com evidência reproduzível em homologação.

Legenda de prioridade:

- **P0**: bloqueia substituição do Streamlit;
- **P1**: precisa estar no primeiro lançamento, mas não bloqueia os testes verticais iniciais;
- **P2**: melhoria posterior.

## Autenticação

- [ ] **P0 AUTH-01** Entrar com e-mail e senha válidos.
- [ ] **P0 AUTH-01** Exibir mensagem localizada para credenciais inválidas, rede indisponível e excesso de tentativas.
- [ ] **P0 AUTH-01** Restaurar somente sessão Firebase válida ao reiniciar.
- [ ] **P0 AUTH-01** Impedir acesso às rotas privadas sem usuário autenticado.
- [ ] **P0 AUTH-02** Criar conta com validação de campos, senha e confirmação.
- [ ] **P0 AUTH-03** Sair e bloquear imediatamente as rotas privadas.
- [ ] **P1** Redefinir senha por e-mail.
- [ ] **P1** Solicitar exclusão da conta e de seus dados.
- [ ] **P2** Verificar endereço de e-mail.

## Configuração

- [x] **P0 PLAN-01** Listar divisões e exercícios na ordem configurada.
- [x] **P0 PLAN-01** Ler documento legado sem `Ordem` e colocá-lo ao final.
- [x] **P0 PLAN-02** Adicionar exercício com divisão, nome, 1–10 séries e ordem positiva.
- [x] **P1 PLAN-04** Editar exercício existente.
- [x] **P1 PLAN-04** Reordenar exercícios de uma divisão.
- [x] **P0 PLAN-03** Excluir somente o documento selecionado por ID.
- [x] **P0 PLAN-03** Confirmar exclusão e apresentar falha/sucesso.
- [x] **P0** Mostrar estados carregando, vazio, erro e conteúdo.

## Treino ativo

- [x] **P0 ACTIVE-01** Orientar cadastro quando não houver plano.
- [x] **P0 ACTIVE-01** Selecionar data e divisão e iniciar com exercícios ordenados.
- [x] **P0 ACTIVE-02** Criar séries com carga 0, repetições 0, RPE 8 e observação vazia.
- [x] **P0 ACTIVE-02** Validar carga/repetições não negativas e RPE entre 1 e 10.
- [x] **P0 ACTIVE-02** Navegar anterior/próximo sem perder valores.
- [x] **P0 ACTIVE-02** Persistir e restaurar o rascunho após reinício do app.
- [x] **P0 ACTIVE-03** Ignorar séries com zero repetição.
- [x] **P0 ACTIVE-03** Não encerrar silenciosamente quando nenhuma série for válida.
- [x] **P0 ACTIVE-03** Concluir em batch e criar uma única sessão lógica.
- [x] **P0 ACTIVE-03** Impedir duplicação por toque repetido ou nova tentativa.
- [x] **P0 ACTIVE-04** Confirmar antes de abortar e apagar o rascunho após confirmação.
- [x] **P0** Manter dados locais quando a gravação remota falhar.

## Registro manual

- [ ] **P0 MANUAL-01** Selecionar data/divisão e mostrar todos os exercícios em ordem.
- [ ] **P0 MANUAL-01** Reutilizar as mesmas validações e componente de série do treino ativo.
- [ ] **P0 MANUAL-02** Ignorar séries com zero repetição.
- [ ] **P0 MANUAL-02** Gravar em batch sem duplicidade.
- [ ] **P0 MANUAL-02** Exibir feedback ao tentar enviar sem séries válidas.

## Evolução

- [ ] **P0 PROGRESS-01** Mostrar estado vazio sem histórico.
- [ ] **P0 PROGRESS-01** Filtrar histórico por exercício.
- [ ] **P0 PROGRESS-01** Consultar período paginado/limitado.
- [ ] **P0 PROGRESS-02** Calcular `1RM = carga * (1 + repetições / 30)`.
- [ ] **P0 PROGRESS-02** Mostrar maior carga e maior 1RM por data.
- [ ] **P0 PROGRESS-03** Somar volume `carga * repetições` por data.
- [ ] **P1** Oferecer alternativa textual acessível aos gráficos.
- [ ] **P0** Ignorar ou sinalizar documento inválido sem derrubar a tela inteira.

## Peso

- [ ] **P0 WEIGHT-01** Registrar peso por data com precisão de 0,1 kg.
- [ ] **P0 WEIGHT-01** Atualizar a pesagem existente na mesma data.
- [ ] **P0 WEIGHT-02** Ler e normalizar duplicatas legadas.
- [ ] **P0 WEIGHT-02** Calcular média móvel dos últimos sete registros.
- [ ] **P0 WEIGHT-02** Mostrar pontos e tendência, além de resumo textual acessível.
- [ ] **P0** Mostrar estados carregando, vazio, erro e conteúdo.

## Segurança, qualidade e compatibilidade

- [ ] **P0 DATA-01** Ler os três formatos de coleção legados sem migração física.
- [ ] **P0 DATA-01** Restringir cada caminho ao UID autenticado pelas Security Rules.
- [ ] **P0 DATA-01** Negar acesso anônimo e acesso cruzado entre usuários.
- [ ] **P0 DATA-01** Paginar históricos e evitar leitura ilimitada.
- [ ] **P0** Passar typecheck, lint, testes de domínio/aplicação e testes das regras.
- [ ] **P0** Passar os seis cenários E2E definidos no plano principal.
- [ ] **P0** Atender à matriz mínima Android/iOS e aos requisitos de acessibilidade.
- [ ] **P0** Não enviar credenciais, tokens, e-mail, observações ou medidas para logs/telemetria.

## Aprovação

- Responsável pelo produto: **pendente**
- Data: **pendente**
- Observações: **pendente**

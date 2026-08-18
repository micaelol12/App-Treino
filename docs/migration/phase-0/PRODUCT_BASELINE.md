# Baseline de produto

As decisões abaixo são defaults executáveis. Itens marcados como “validar” podem ser alterados sem refazer a Fase 0, desde que o checklist seja atualizado antes da implementação afetada.

## Plataformas e escopo

| Decisão | Baseline |
| --- | --- |
| Plataformas da primeira versão | Android e iOS |
| Web | Fora da primeira entrega; não bloquear compatibilidade futura do código |
| Idioma | pt-BR |
| Orientação | Retrato; paisagem não precisa de layout dedicado na primeira versão |
| Unidades | Quilogramas e repetições inteiras |
| Autenticação | E-mail e senha |
| Compatibilidade | Ler dados atuais sem migração destrutiva |

Validar antes da Fase 2: web como requisito comercial, suporte a libras e outros idiomas.

## Direção visual mínima

Até existir marca aprovada, usar uma identidade funcional e discreta:

- caráter: esportivo, objetivo e legível, sem estética agressiva;
- tema claro obrigatório; tema escuro desejável, mas pode ser entregue depois do corte vertical;
- cor primária provisória: azul escuro; sucesso: verde; atenção: âmbar; erro: vermelho;
- nunca comunicar estado somente por cor;
- números de carga, repetições e progresso recebem maior hierarquia visual;
- componentes usam tokens semânticos, sem cores ou espaçamentos literais nas telas;
- ícones sempre acompanhados de label acessível; ações críticas mantêm texto visível.

Logo, nome comercial, família tipográfica e paleta final estão **a validar**. O nome de trabalho permanece “Sistema de Telemetria de Treino”.

## Acessibilidade mínima

- alvo de toque mínimo de 48 x 48 dp;
- contraste mínimo de 4,5:1 para texto comum e 3:1 para texto grande/elementos relevantes;
- suporte a fonte ampliada sem cortar campos ou ações principais;
- ordem de foco coerente e labels para controles, abas, gráficos e mensagens;
- erros identificados em texto junto ao campo e anunciados por leitor de tela;
- alternativa textual com valores principais para cada gráfico;
- teclado apropriado para e-mail, carga, peso e repetições;
- não depender de gesto complexo para editar, ordenar ou excluir;
- respeitar redução de movimento quando animações forem adicionadas.

## Matriz mínima de dispositivos

| Plataforma | Perfil | Referência de teste | Obrigatório |
| --- | --- | --- | --- |
| Android | compacto/entrada | 360 x 800 dp, Android 10 ou mínimo suportado pelo Expo adotado | Sim |
| Android | médio/atual | 412 x 915 dp, versão Android atual | Sim |
| iOS | compacto | iPhone SE (3ª geração) ou viewport equivalente | Sim |
| iOS | padrão atual | iPhone de 6,1 polegadas ou viewport equivalente | Sim |
| Tablet | largura expandida | emulador Android ou iPad | Smoke test, sem layout dedicado |

As versões exatas de SO serão fixadas na Fase 2 de acordo com a versão Expo escolhida e a política vigente das lojas.

## Métricas de aceitação

### Funcionais

- 100% dos itens P0 do checklist aprovados;
- 100% dos seis fluxos E2E críticos aprovados em Android e iOS;
- zero perda de rascunho nos cenários de navegação, reinício e falha de gravação;
- zero duplicidade em 100 tentativas automatizadas de reenvio/conclusão;
- cálculos da fixture com diferença máxima de `0,01` por arredondamento.

### Qualidade

- zero erro de TypeScript e lint no pipeline;
- cobertura de linhas mínima de 80% em `domain` e `application`, acompanhada de testes de cenários de borda;
- zero regra de segurança P0 falhando no Emulator Suite;
- zero defeito bloqueador ou crítico aberto para beta.

### Experiência e desempenho

- tela interativa em até 3 segundos no perfil Android de entrada em uma inicialização sem cache, medido em build de release de homologação;
- resposta visual ao toque em até 100 ms, mesmo quando a operação remota continuar em andamento;
- consultas iniciais limitadas e paginadas, sem download integral do histórico;
- sessão beta com taxa livre de crash de pelo menos 99,5%;
- nenhuma falha crítica no roteiro manual com leitor de tela e fonte ampliada.

Metas dependentes de rede devem ser medidas separando tempo do cliente e tempo do Firebase; não reprovar o app por latência externa sem diagnóstico.

## Retenção e exclusão — proposta

Esta é uma baseline de produto, não aconselhamento jurídico. Deve ser validada antes da publicação.

| Dado | Retenção proposta | Exclusão |
| --- | --- | --- |
| Planos, treinos e pesos | Enquanto a conta estiver ativa | Remover ao excluir a conta |
| Rascunho local | Até concluir/abortar ou 30 dias sem atualização | Remover no logout e na exclusão da conta |
| Logs técnicos sem conteúdo de treino | Até 30 dias em desenvolvimento/homologação | Expiração automática |
| Telemetria de erro sem PII | Até 90 dias | Conforme ferramenta e solicitação aplicável |
| Backups gerenciados | Conforme política Firebase aprovada | Expiração conforme ciclo documentado |

Requisitos do fluxo de exclusão:

1. reautenticar quando exigido pelo Firebase;
2. interromper novas escritas;
3. remover subcoleções do usuário por operação backend confiável e auditável;
4. excluir a conta do Firebase Authentication;
5. apagar rascunhos, caches e tokens locais;
6. confirmar conclusão sem expor detalhes internos.

O cliente não deve simular exclusão apagando apenas o documento pai; isso não remove subcoleções do Firestore.

## Ambientes Firebase

| Ambiente | Finalidade | Dados permitidos | Acesso |
| --- | --- | --- | --- |
| `development` | desenvolvimento local e Emulator Suite | somente fixture anônima | equipe técnica |
| `staging` | builds internos e validação de produto | contas sintéticas; sem cópia de produção por padrão | equipe e QA |
| `production` | usuários reais | dados reais | mínimo necessário |

Regras:

- cada ambiente remoto usa projeto Firebase distinto;
- IDs, aliases e arquivos de configuração ainda precisam ser confirmados com o responsável pela conta Firebase;
- configuração pública do cliente é separada por profile de build;
- credencial do Admin SDK nunca entra no app, build ou repositório;
- nenhum teste automatizado destrutivo aponta para produção.

## Decisões pendentes de aprovação

1. Aprovar Android+iOS e confirmar que web está fora da primeira entrega.
2. Aprovar o checklist P0/P1/P2.
3. Confirmar identidade visual provisória ou fornecer marca.
4. Validar a política de retenção/exclusão com produto/jurídico.
5. Informar ou provisionar projetos Firebase de staging e produção.

# Fase 5 — Treino ativo

Implementação concluída localmente em 15/08/2026.

## Fluxo entregue

- a aba Treino consome o plano ordenado da Fase 4 e permite selecionar data e divisão;
- cada exercício inicia com carga `0`, repetições `0`, RPE `8` e observação vazia;
- anterior e próximo preservam todas as séries e exibem o progresso da sessão;
- o rascunho é salvo pelo Zustand no AsyncStorage a cada alteração e restaurado após
  reinício do aplicativo;
- o rascunho contém o UID proprietário, não é exibido para outra conta e é apagado
  no logout;
- abortar ou descartar exige confirmação explícita;
- falha de validação ou gravação remota mantém o rascunho local;
- somente séries com repetições maiores que zero entram no histórico;
- a conclusão usa um único batch do Firestore e IDs de documento determinísticos
  derivados de `sessionId`, exercício e número da série.

## Idempotência

O `sessionId` é criado antes do treino começar e permanece no rascunho. Cada série
executada recebe sempre o mesmo ID de documento em novas tentativas da mesma sessão.
Assim, um toque repetido ou uma repetição após resposta de rede incerta sobrescreve
os mesmos registros, mantendo uma única sessão lógica identificada por `sessionId`.

O teste de integração executa o mesmo batch duas vezes contra o Firestore Emulator e
confirma que a coleção continua contendo apenas a quantidade original de séries.

## Validações

- data civil real no formato `YYYY-MM-DD`;
- carga entre 0 e 2000 kg;
- repetições inteiras entre 0 e 1000;
- RPE inteiro entre 1 e 10;
- observação com até 500 caracteres;
- ao menos uma série com repetições para concluir.

As regras ficam em `workout-session/domain`, o caso de uso de conclusão em
`workout-session/application`, o batch em `workout-session/infrastructure` e as
telas/store em `workout-session/presentation`. O componente de edição de série foi
separado para reutilização no registro manual da Fase 6.

## Evidências automatizadas

- testes de domínio para criação, normalização, limites e filtro de séries;
- teste do caso de uso para isolamento por usuário e preparação da conclusão;
- testes do store para edição, navegação, limpeza e reidratação pelo AsyncStorage;
- teste de integração do batch idempotente no Firestore Emulator;
- fluxo Maestro versionado para iniciar, navegar, reiniciar, restaurar e concluir;
- typecheck, lint, Prettier e suíte unitária com cobertura.

O smoke test manual em dispositivos Android/iOS continua pertencendo à matriz de
hardening e publicação da Fase 8.

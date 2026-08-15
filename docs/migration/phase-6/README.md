# Fase 6 — Registro manual

Implementação concluída localmente em 15/08/2026.

## Fluxo entregue

- a aba Registro carrega o plano autenticado e oferece seleção de data e divisão;
- o formulário exibe, em uma única tela rolável, todos os exercícios e todas as
  séries configuradas para a divisão escolhida;
- carga, repetições, RPE e observação usam o mesmo `WorkoutSetEditor` do treino
  ativo;
- cada campo recebe um identificador de teste que inclui o exercício, evitando
  ambiguidades quando várias séries de número igual aparecem simultaneamente;
- alterar os metadados depois de começar exige confirmação antes de apagar os
  valores preenchidos;
- falhas de validação ou gravação mantêm o formulário disponível para correção e
  nova tentativa;
- após o sucesso, o formulário é limpo e fica pronto para um novo registro.

## Contrato, atomicidade e idempotência

O registro manual cria um `WorkoutSessionDraft` pelas mesmas regras de domínio da
Fase 5 e o envia pelo mesmo `CompleteWorkoutSession`. Portanto, séries com zero
repetições são ignoradas e as demais são gravadas em um único batch na coleção
`usuarios/{uid}/historico_treinos`, com os mesmos campos legados e metadados.

O ID da sessão é criado ao montar o formulário e permanece estável em todas as
tentativas. Os IDs dos documentos continuam derivados da sessão, do exercício e do
número da série. Além disso, uma trava síncrona local ignora um segundo toque antes
mesmo de a interface refletir o estado pendente. Assim, repetição de toque, retry
após falha incerta e reexecução do batch convergem para a mesma sessão lógica.

Como o formato persistido é idêntico ao do treino ativo, os registros ficam
disponíveis para as mesmas consultas e análises da Fase 7, sem adaptação ou migração.

## Validação automatizada

- teste de componente do formulário completo e do filtro por divisão;
- teste da integração com o caso de uso compartilhado e do conteúdo do rascunho;
- teste de proteção contra envio duplicado;
- teste de mensagem contextual e preservação do formulário em erro;
- fluxo Maestro versionado para cadastro do plano e registro manual;
- suíte preexistente de domínio, aplicação, batch idempotente e regras do Firestore.

Na pasta `mobile`:

```powershell
npm run verify
npm run test:rules
```

Com os emuladores reiniciados, o Development Build aberto e o Maestro disponível:

```powershell
maestro test .maestro/manual-workout-flow.yaml
```

O smoke test em dispositivos Android/iOS permanece na matriz de hardening da Fase
8.

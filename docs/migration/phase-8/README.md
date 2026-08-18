# Fase 8 — Hardening, beta e corte

Implementação local concluída em 17/08/2026. A liberação externa continua
condicionada às evidências em aparelhos Android/iOS, à URL pública de privacidade e
exclusão e à aprovação de produto.

## Hardening entregue

- NetInfo integra o estado de conectividade ao TanStack Query;
- consultas transitórias repetem no máximo duas vezes com backoff e retomam ao
  reconectar ou reabrir o app; falhas permanentes não entram em retry;
- um banner acessível informa o estado offline sem descartar o rascunho ativo;
- o boundary global e os caches de query/mutation emitem eventos sanitizados para
  o endpoint HTTPS opcional `EXPO_PUBLIC_ERROR_REPORTING_ENDPOINT`;
- documentos legados rejeitados geram evento com coleção, códigos e caminhos dos
  campos, nunca com ID, conteúdo do documento ou mensagem/pilha da exceção;
- exclusão de conta exige reautenticação, remove as três subcoleções em batches de
  até 450 documentos e só então remove o usuário do Firebase Authentication;
- a política de contraste WCAG AA é automatizada para os pares de cor usados em
  texto, estados e botões.

## Acessibilidade entregue no código

- títulos de tela são cabeçalhos e recebem foco ao abrir;
- controles compartilhados expõem label, papel e estado desabilitado;
- alvos interativos têm no mínimo 48 pontos lógicos;
- campos de séries quebram linha com fonte ampliada;
- erros, carregamento, progresso, sucesso e estado offline usam semântica/live
  region; gráficos mantêm resumo textual;
- a política de privacidade está acessível pela tela Ajustes.

## E2E e operação

A pasta `mobile/.maestro` contém seis fluxos: autenticação, CRUD/reordenação,
treino ativo com restauração, registro manual, peso/evolução e exclusão de conta.
Execute a suíte uma vez no Android e outra no iOS conforme a
[matriz de validação](DEVICE_AND_NETWORK_MATRIX.md).

- [Checklist de release, lojas e rollback](RELEASE_CHECKLIST.md)
- [Matriz de dispositivo, acessibilidade e rede](DEVICE_AND_NETWORK_MATRIX.md)
- [Política de privacidade](../../legal/PRIVACY_POLICY.md)

## Pendências externas para o critério de saída

- executar e anexar os resultados Maestro em Android e iOS;
- fazer smoke test com TalkBack, VoiceOver e fonte de 200%;
- preencher o contato do controlador e publicar política/solicitação de exclusão
  em URLs públicas estáveis;
- configurar o endpoint de telemetria de homologação e validar recebimento;
- concluir Data safety/App Privacy, classificação etária e metadados nas lojas;
- obter aprovação de produto no checklist de paridade.

Até essas evidências existirem, o código está pronto para beta interno, mas o
critério de saída da Fase 8 não deve ser marcado como aprovado.

## Evidências locais de 17/08/2026

- Expo Doctor: 21/21 verificações aprovadas;
- `npm run verify`: 30 suítes, 146 testes e cobertura agregada de 96,77% de
  statements / 92,35% de branches;
- `npm run test:rules`: 26 cenários aprovados no Firestore Emulator;
- `npm audit --omit=dev --audit-level=critical`: aprovado sem vulnerabilidade
  crítica. Permanecem alertas transitivos high/moderate do toolchain Expo/Metro sem
  correção não disruptiva; `npm audit fix --force` propõe downgrade incompatível e
  não deve ser executado. Reavaliar quando o SDK publicar patches compatíveis;
- E2E em dispositivo: não executado nesta sessão porque a CLI Maestro não está
  instalada; permanece no gate de beta.

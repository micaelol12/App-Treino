# Matriz de dispositivo, acessibilidade e rede

Registre aparelho/SO, build, executor, data e evidência (log, captura ou vídeo) em
cada linha. Use contas exclusivas de homologação e reinicie os emuladores Firebase
antes da suíte para que os e-mails E2E possam ser recriados.

| Cenário | Android | iOS | Aceite |
| --- | --- | --- | --- |
| Seis fluxos `mobile/.maestro` | Pendente | Pendente | Todos aprovados, sem retry manual |
| Tela pequena, tema claro/escuro | Pendente | Pendente | Sem corte ou sobreposição |
| Fonte do sistema em 200% | Pendente | Pendente | Conteúdo e ações continuam alcançáveis |
| TalkBack/VoiceOver | Pendente | Pendente | Ordem, labels, estado e foco compreensíveis |
| Teclado e foco de formulários | Pendente | Pendente | Erro anunciado e campo editável visível |
| Rotação/reabertura | N/A (portrait) | N/A (portrait) | Retomada no estado consistente |

## Rede e retomada

1. Inicie um treino, preencha séries e feche o app. Reabra e confirme a restauração.
2. Desative a rede antes de concluir. Confirme o banner, a mensagem segura e a
   permanência do rascunho. Reative a rede e conclua uma vez; verifique apenas um
   `sessionId` no Firestore.
3. Em peso, desative a rede antes de salvar. Confirme que não há falso sucesso;
   reative e envie novamente, verificando o upsert pelo mesmo `YYYY-MM-DD`.
4. Simule rede lenta (Android Emulator: velocidade EDGE/latência alta; iOS:
   Network Link Conditioner). Confirme loading acessível e ausência de toque duplo.
5. Encerre o Firestore Emulator durante uma leitura e reinicie-o. Confirme retry
   limitado, ação **Tentar novamente** e atualização após reconectar.
6. Teste exclusão com senha errada, offline, mais de 450 documentos e sucesso.
   Após sucesso, o login antigo deve falhar e as três subcoleções devem estar vazias.

## Auditoria manual de acessibilidade

- navegue por swipe sem tocar na tela e confirme que cada ação tem nome único;
- confirme que o foco começa no título ao trocar de tela;
- verifique alvos de 48 × 48 e ausência de ação apenas por cor;
- confirme leitura dos resumos dos gráficos e dos valores do histórico;
- use screenshot/Accessibility Scanner como apoio, sem substituir TalkBack e
  VoiceOver reais.

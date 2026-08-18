# Checklist de beta, lojas e rollback

## Gate técnico

- [ ] `npm run doctor` sem incompatibilidades.
- [ ] `npm run test:all` aprovado no commit candidato.
- [ ] `npm audit --omit=dev --audit-level=critical` aprovado.
- [ ] Seis fluxos Maestro aprovados em Android e iOS.
- [ ] Regras e índices comparados com o projeto de homologação/produção.
- [ ] Leitura das fixtures legadas e evento `legacy_document_rejected` validados.
- [ ] Endpoint de telemetria recebe evento sanitizado e rejeita payload fora do contrato.
- [ ] Nenhum P0/P1 aberto; aprovação de produto registrada no checklist de paridade.

## Privacidade e lojas

- [x] Exclusão completa disponível em **Ajustes**, com confirmação e reautenticação.
- [x] Política descreve dados, finalidades, terceiros, retenção e exclusão.
- [ ] Substituir o contato pendente e publicar a política em URL pública estável.
- [ ] Criar página web pública para solicitar exclusão fora do app.
- [ ] Atualizar no app o link de privacidade se a URL final não for a do repositório.
- [ ] Preencher **App Privacy** no App Store Connect conforme o build final.
- [ ] Preencher **Data safety** e as perguntas de Data deletion no Play Console.
- [ ] Informar URL de privacidade em ambas as lojas e URL web de exclusão no Google Play.
- [ ] Revisar classificação etária, screenshots, descrição, suporte e território.

A Apple exige política na ficha e dentro do app, além de exclusão dentro do app
quando há criação de conta: [App Store Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage) e
[orientação de account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
O Google Play exige caminho no app, exclusão dos dados associados, respostas de
Data safety e também um recurso web funcional para solicitar exclusão:
[Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

## Beta controlado

- [ ] Gerar `preview` com `APP_VARIANT=staging` e projeto Firebase de homologação.
- [ ] Distribuir primeiro ao time interno; depois a um grupo pequeno com consentimento.
- [ ] Fornecer canal privado de feedback e proibir dados de saúde/credenciais em relatos.
- [ ] Registrar versão, coorte, período, P0/P1, taxa de erro e decisão go/no-go.
- [ ] Promover exatamente o commit/build aprovado, sem recompilar alterações não testadas.

## Rollback

Gatilhos: acesso cruzado, perda/duplicação de dados, falha generalizada de login,
crash de inicialização, exclusão incompleta recorrente ou aumento crítico de erros
legados.

1. Pausar a distribuição e retirar o build do canal de teste/produção quando a loja
   permitir; não alterar dados nem regras no impulso.
2. Preservar logs sanitizados, versão, horário e projeto afetado. Nunca copiar
   documentos pessoais para tickets.
3. Se a regressão estiver no app, redistribuir o último build aprovado. Como o
   contrato Firestore continua legado e aditivo, não há migração física a reverter.
4. Se estiver em regras/índices, publicar a última versão Git auditada, executar a
   suíte do Emulator e fazer smoke test com dois usuários antes de reabrir.
5. Se houver escrita incorreta, bloquear o fluxo afetado e preparar restauração a
   partir de backup/exportação validada. Não executar exclusão ou script corretivo
   sem lista de documentos, dry-run e aprovação.
6. Comunicar impacto e recuperação, abrir análise de causa e só retomar após todos
   os gates técnicos.

Registrar aqui antes do beta: build anterior, commit anterior, responsáveis,
contatos das lojas, localização do backup/exportação e prazo máximo de decisão.

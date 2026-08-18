# Firebase local

Esta configuração usa `demo-app-treino` como projeto padrão. IDs com prefixo `demo-` são destinados ao Emulator Suite e evitam acesso acidental a recursos remotos.

## Arquivos

- `firestore.rules`: autorização por proprietário e validação das três coleções;
- `firestore.indexes.json`: índices previstos para ordenação e filtros paginados;
- `import/exercise-taxonomies`: JSONs e manifesto das seis taxonomias do catálogo;
- `scripts/generate-exercise-taxonomies.cjs`: gerador determinístico das taxonomias;
- `../firebase.json`: portas e associação dos arquivos;
- `../firebase.test.json`: configuração isolada dos testes na porta 8082;
- `../.firebaserc`: projeto demo local.

## Executar os testes

Na pasta `mobile`:

```powershell
npm run test:rules
```

O comando inicia o Firestore Emulator na porta 8082, executa apenas a suíte de regras e encerra o processo. São necessários Node.js, Java JDK 21 e as dependências instaladas.

Para QA manual, mantenha o emulador aberto em um terminal e carregue a fixture em outro. O seed usa IDs determinísticos e pode ser repetido:

```powershell
npm run emulator:start
npm run emulator:seed
```

Não alterar o projeto default para produção. Deploys futuros devem usar alias e projeto explícitos, depois de revisão e aprovação:

```text
firebase deploy --only firestore:rules,firestore:indexes --project <alias-aprovado>
```

Nenhum deploy remoto faz parte da Fase 1.

## Migrar planos para catálogo e divisões v2

O migrador usa credenciais padrão do Google/Firebase Admin, começa em modo de
simulação e nunca remove `config_treinos`:

```powershell
cd mobile
npm run migrate:plans:v2 -- --project <project-id> --user <uid> `
  --aliases ../firebase/migrations/workout-plan-aliases.example.json `
  --report ../firebase/migrations/report.json
```

Revise `pending` no relatório. Para gravar documentos v2, repita exatamente o
comando com `--apply`. A gravação é bloqueada enquanto existir uma pendência. O
script é idempotente, usa IDs determinísticos para as divisões e o ID físico
existente em `exercicios` para cada item do plano.

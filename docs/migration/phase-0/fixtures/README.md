# Massa anônima de homologação

O arquivo `firestore-baseline.json` descreve documentos sob:

```text
usuarios/{fixtureUserId}/{collection}/{id}
```

Ele não contém dados, IDs ou credenciais de usuários reais. Na Fase 1, um seed idempotente deve convertê-lo em dados do Firebase Emulator Suite. Não executar seed contra produção.

## Cenários cobertos

- plano ordenado normalmente;
- exercício legado sem campo `Ordem`, esperado ao final da divisão;
- dois exercícios homônimos em divisões diferentes, para garantir exclusão por ID;
- histórico legado sem `sessionId`, timestamps ou versão de schema;
- cálculos de volume e 1RM em duas datas;
- sete pesagens e uma duplicata legada na mesma data;
- segundo usuário para testes de isolamento pelas Security Rules.

## Resultados esperados

### Supino Reto — 01/07/2026

- maior carga: `60 kg`;
- maior 1RM estimada: `80 kg`;
- volume total: `1080 kg`.

### Supino Reto — 08/07/2026

- maior carga: `62,5 kg`;
- maior 1RM estimada: `83,33 kg`, arredondada para duas casas;
- volume total: `1187,5 kg`.

### Peso

Sem a duplicata, a média dos sete registros de 01/07 a 07/07 é `79,61 kg`, arredondada para duas casas.

A fixture possui duas pesagens em 07/07 para expor uma ambiguidade do legado: o código atual mantém a ocorrência que aparecer por último após a ordenação, mas a ordem original do stream não é um contrato confiável. O novo mapper deve adotar uma regra determinística. Default proposto:

1. preferir documento novo com `updatedAt` mais recente;
2. na ausência de timestamp legado, usar o maior ID como desempate apenas na normalização;
3. novas escritas usam ID de documento `YYYY-MM-DD`, eliminando a ambiguidade.

O valor final da média deve ser recalculado depois da normalização da duplicata e testado explicitamente.

## Validações de isolamento

- `qa_primary_user` pode ler e escrever somente seus três caminhos;
- `qa_secondary_user` não pode ler nenhum documento do primeiro usuário;
- usuário não autenticado não pode ler ou escrever nenhum dos caminhos;
- o documento `secondary_private_exercise` nunca deve aparecer nas consultas do primeiro usuário.

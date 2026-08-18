# Taxonomias do catálogo de exercícios

Arquivos gerados a partir de `exercises-ptbr-full-translation.json` (873
exercícios). Cada arquivo é um array JSON e deve ser importado na coleção com o
mesmo nome do arquivo:

| Campo no exercício                    | Coleção Firestore | Arquivo             | Documentos |
| ------------------------------------- | ----------------- | ------------------- | ---------: |
| `equipment`                           | `equipamentos`    | `equipamentos.json` |         12 |
| `category`                            | `categorias`      | `categorias.json`   |          7 |
| `force`                               | `forcas`          | `forcas.json`       |          3 |
| `level`                               | `niveis`          | `niveis.json`       |          3 |
| `mechanic`                            | `mecanicas`       | `mecanicas.json`    |          2 |
| `primaryMuscles` / `secondaryMuscles` | `musculos`        | `musculos.json`     |         17 |

## Regra de importação

O app trata `id` como identificador lógico. IDs automáticos do Firestore são
suportados: o mapeador mantém o `documentId` físico e o `id` presente no JSON.

Os campos `exerciseCount`, `primaryExerciseCount` e
`secondaryExerciseCount` são metadados do arquivo de origem; eles ajudam na
auditoria, mas não substituem consultas aos exercícios. `active` permite retirar
uma opção de novos cadastros sem quebrar documentos existentes, e `order`
controla a ordem de exibição.

Valores ausentes não viraram documentos artificiais. O arquivo original possui:

- 77 exercícios sem `equipment`;
- 29 exercícios sem `force`;
- 87 exercícios sem `mechanic`.

O `manifest.json` registra as coleções, arquivos, contagens e campos de origem.

## Identidade em `exercicios`

Cada exercício deve manter o campo lógico `id` único. Como o upload existente
criou IDs automáticos, os itens do plano salvam `exerciseId` e
`exerciseDocumentId`; as regras validam que ambos apontam para o mesmo exercício.

## Regeneração

Na raiz do projeto:

```powershell
node firebase/scripts/generate-exercise-taxonomies.cjs `
  "C:\caminho\exercises-ptbr-full-translation.json"
```

O gerador valida que a raiz é um array e recria os seis JSONs e o manifesto de
forma determinística.

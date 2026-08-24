# Importação do catálogo de exercícios

O importador lê o dataset em
`C:\Users\User\Desktop\Micael\code\exercises-dataset`, traduz os nomes e as
instruções do inglês para português com a Cloud Translation API, valida todas
as 1.324 imagens e GIFs e prepara um JSON compatível com o aplicativo.

Por padrão, nada remoto é alterado:

```powershell
cd mobile
npm run catalog:import -- --project projeto-treino-505118
```

As traduções ficam em um cache retomável ignorado pelo Git. O catálogo pt-BR é
gravado em `firebase/import/exercises.pt-BR.json`. Configure credenciais com
`GOOGLE_APPLICATION_CREDENTIALS` ou execute `gcloud auth application-default
login`. A Cloud Translation API precisa estar habilitada no projeto usado para
tradução.

Depois de revisar o arquivo preparado, a substituição remota exige o bucket e
uma confirmação redundante do projeto:

```powershell
npm run catalog:import -- \
  --project projeto-treino-505118 \
  --bucket NOME_EXATO_DO_BUCKET \
  --confirm-project projeto-treino-505118 \
  --apply
```

No modo `--apply`, o importador:

1. envia todas as mídias a uma área temporária;
2. publica as novas mídias em `exercise-media/{id}/images|videos`;
3. remove e recria `exercicios`, `equipamentos`, `categorias`, `forcas`,
   `niveis`, `mecanicas` e `musculos`;
4. remove mídias antigas que não pertencem ao novo catálogo;
5. apaga a área temporária após a conclusão.

As coleções em `usuarios` não são removidas. Porém, planos existentes que
referenciem IDs físicos do catálogo antigo podem ficar sem correspondência,
pois o novo catálogo usa o ID lógico de quatro dígitos como ID do documento.

Se ocorrer uma falha depois do início da substituição, o script informa e
preserva `_exercise-imports/<run-id>/` no Storage para recuperação manual.

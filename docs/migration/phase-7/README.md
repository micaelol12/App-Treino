# Fase 7 — Peso e evolução

Implementação concluída localmente em 15/08/2026.

## Peso

- a aba Peso registra entre 30 e 500 kg para uma data civil válida;
- novas escritas usam a data `YYYY-MM-DD` como ID e uma transação preserva
  `createdAt` durante o upsert;
- a consulta é ordenada e paginada por data e ID, com 30 documentos por página;
- documentos legados com IDs aleatórios continuam sendo aceitos;
- datas duplicadas são normalizadas de forma determinística: vence o `updatedAt`
  mais recente e, sem timestamp, o maior ID;
- a tendência é a média móvel dos últimos sete registros, não de sete dias corridos;
- o histórico acumulado e o gráfico são recalculados a cada página carregada.

## Evolução de treino

- o filtro usa os exercícios do plano autenticado e consulta somente o exercício
  selecionado;
- a consulta do histórico é paginada em 200 séries por página e usa o índice por
  `Exercício` e `Data` já versionado;
- registros com `sessionId` são agregados por sessão; registros legados são
  agregados por data e divisão, que é o melhor identificador disponível no contrato
  antigo;
- a carga máxima é o maior peso de uma série na sessão;
- a 1RM mantém a fórmula histórica de Epley:
  `carga * (1 + repetições / 30)`;
- o volume é a soma de `carga * repetições` das séries da sessão.

## Spike de gráficos

A camada adotada é `react-native-svg` 15.15.4, instalada com `expo install`. A
[documentação oficial do Expo](https://docs.expo.dev/versions/latest/sdk/svg/)
confirma o pacote como módulo compatível e documenta a mesma instalação.

Em vez de incorporar uma biblioteca de gráficos de alto nível, o app possui um
único componente SVG pequeno para linhas e barras. Esta decisão mantém apenas uma
dependência nativa suportada pelo Expo, oferece controle direto dos tokens de tema
e evita a incompatibilidade observada em bibliotecas antigas de gráficos SVG.

O componente:

- mede a largura disponível e mantém altura fixa para telas pequenas;
- adiciona rolagem horizontal proporcional ao número de pontos;
- usa cores dos temas claro e escuro e não fixa cores de fundo;
- expõe um resumo completo para leitor de tela, legenda textual e valores atuais;
- reduz automaticamente a quantidade de rótulos no eixo em datasets longos;
- foi renderizado em teste com 300 pontos e tema escuro.

O smoke test visual e de leitor de tela em dispositivos Android/iOS reais continua
na matriz da Fase 8.

## Evidências automatizadas

- fixtures conhecidas confirmam `60 kg`, `80 kg` de 1RM e `1080 kg` de volume em
  01/07/2026, e `62,5 kg`, `83,33 kg` e `1187,5 kg` em 08/07/2026;
- testes cobrem limites do peso, normalização de duplicatas e média móvel;
- teste do gráfico cobre tema escuro, resumo acessível e 300 pontos;
- integração no Firestore Emulator cobre upsert determinístico, leitura legada,
  paginação e filtro por exercício;
- regras confirmam isolamento por UID e metadados das novas escritas.

Na pasta `mobile`:

```powershell
npm run verify
npm run test:rules
```

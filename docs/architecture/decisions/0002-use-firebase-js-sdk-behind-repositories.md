# ADR 0002 — Usar Firebase JS SDK atrás de repositórios

- Status: Aceito
- Data: 14/08/2026

## Contexto

O escopo inicial usa Firebase Authentication e Cloud Firestore. Ambos são atendidos pelo Firebase JS SDK no Expo, sem código nativo adicional. O projeto ainda não requer Analytics, Crashlytics, Dynamic Links ou outro serviço exclusivamente nativo.

Acoplar componentes React diretamente ao SDK espalharia DTOs, mensagens de erro e detalhes de consulta pela interface, dificultando testes e uma eventual troca de implementação.

## Decisão

Usar Firebase JS SDK na primeira versão. Todo acesso passa por implementações de contratos de repositório na camada `infrastructure`; domínio e casos de uso não importam Firebase.

O estado de autenticação vem do Firebase Authentication. Nenhum UID persistido separadamente é aceito como identidade.

## Consequências

- Authentication e Firestore funcionam com o fluxo padrão do Expo;
- schemas e mapeadores controlam a fronteira schemaless;
- testes de casos de uso podem usar repositórios falsos;
- a troca para React Native Firebase fica localizada na infraestrutura;
- funcionalidades nativas ausentes no JS SDK exigem reavaliar esta decisão.

## Gatilhos para revisão

- necessidade aprovada de Crashlytics, Analytics, App Check ou outro serviço nativo;
- requisito de persistência/offline não atendido pelo SDK escolhido;
- evidência de problema relevante de desempenho ou estabilidade;
- retirada de suporte do Expo/Firebase à combinação adotada.

## Referências

- https://docs.expo.dev/guides/using-firebase/
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/firestore/

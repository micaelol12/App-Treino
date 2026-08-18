# ADR 0001 — Usar Expo como framework React Native

- Status: Aceito
- Data: 14/08/2026

## Contexto

O aplicativo será reescrito para Android e iOS por uma equipe pequena. Ele precisa de navegação, builds reproduzíveis, integração com módulos nativos e um caminho de publicação sem manutenção prematura de projetos nativos manuais.

O aplicativo atual não possui código Android/iOS a preservar nem requisito nativo que obrigue um projeto bare.

## Decisão

Usar Expo com TypeScript, Continuous Native Generation e Development Builds. Usar Expo Router para navegação baseada em arquivos e rotas tipadas.

Expo Go pode ser usado apenas para protótipos compatíveis. O ambiente oficial do projeto será Development Build, pois representa melhor o binário publicado e permite bibliotecas nativas quando necessárias.

## Consequências

- configuração compartilhada de Android e iOS;
- menor custo inicial de toolchain e build;
- rotas e deep links seguem convenção do Expo Router;
- mudanças em dependências nativas exigem reconstruir o Development Build;
- versões de React Native são atualizadas por meio da matriz de compatibilidade do Expo SDK;
- uma ejeção ou código nativo customizado continua possível, mas exige novo ADR.

## Referências

- https://reactnative.dev/docs/environment-setup
- https://docs.expo.dev/router/introduction/
- https://docs.expo.dev/develop/development-builds/introduction/

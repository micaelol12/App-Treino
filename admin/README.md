# App Treino Admin

Painel React Web para administrar o catálogo global do App Treino.

## Executar

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Preencha as variáveis Firebase em `.env.local`. Em produção, o usuário precisa ter
a custom claim `admin: true`. O bypass só funciona quando um emulador Firebase está
configurado e nunca deve ser habilitado em builds de produção.

## Recursos deste incremento

- autenticação e proteção por claim administrativa;
- dashboard com indicadores do catálogo;
- listagem, busca e ativação de exercícios;
- cadastro e edição de exercícios;
- upload de imagens JPEG/PNG/WebP e animação GIF de até 1 MB para o Firebase Storage;
- listagem e cadastro de equipamentos.

O módulo de usuários depende de uma API com Firebase Admin SDK e está sinalizado na
interface como próxima entrega; listar todos os usuários do Firebase Auth não é uma
operação segura para o SDK do navegador.

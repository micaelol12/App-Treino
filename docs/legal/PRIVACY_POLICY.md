# Política de Privacidade — App Treino

Última atualização: 17 de agosto de 2026.

O App Treino usa somente os dados necessários para autenticar a pessoa usuária,
armazenar seu plano e apresentar sua evolução. Esta política descreve o
comportamento da versão móvel publicada a partir da Fase 8.

## Dados tratados

- e-mail e identificador técnico da conta, usados pelo Firebase Authentication;
- divisões e exercícios configurados;
- sessões de treino, incluindo data, carga, repetições, RPE e observações;
- pesagens informadas pela própria pessoa usuária;
- preferência de tema e rascunho do treino ativo, armazenados localmente;
- eventos técnicos de erro com versão do app, plataforma, ambiente, categoria da
  falha e campos inválidos. Esses eventos não incluem e-mail, UID, credenciais,
  token, observações, cargas, repetições ou peso.

## Finalidades e compartilhamento

Os dados são usados para fornecer autenticação, sincronização, registro de treino,
gráficos e suporte técnico. O aplicativo não vende dados, não exibe publicidade e
não usa rastreamento entre aplicativos.

Autenticação e dados sincronizados são processados pelos serviços Firebase do
Google. Quando configurada pelo operador, a telemetria técnica é enviada a um
endpoint HTTPS que deve observar esta mesma política e receber somente o payload
sanitizado descrito acima.

## Retenção, segurança e exclusão

Os dados remotos permanecem enquanto a conta existir. Em **Ajustes > Excluir
conta**, a pessoa confirma a ação com a senha atual; o app remove plano, histórico
de treinos e pesagens e então exclui a conta de autenticação. A ação é permanente.
O rascunho local é removido quando a sessão deixa de existir. Backups operacionais
do provedor podem permanecer pelo período técnico informado pelo respectivo
serviço antes da eliminação definitiva.

O acesso remoto é protegido por autenticação e regras que restringem cada caminho
ao UID proprietário. Tráfego usa HTTPS/TLS. Nenhum sistema é absolutamente imune a
falhas, mas o projeto aplica minimização de dados, validação e testes automatizados
de isolamento.

## Direitos, crianças e alterações

A pessoa pode consultar os dados nas telas do aplicativo, corrigi-los pelos fluxos
disponíveis e excluir a conta. O aplicativo não é direcionado a crianças e não
coleta idade deliberadamente. Mudanças materiais nesta política devem atualizar a
data acima e ser comunicadas na ficha da loja ou no aplicativo.

## Contato

Antes do beta externo, o responsável pela publicação deve adicionar aqui um canal
privado de contato e hospedar esta política em uma URL pública estável. Não envie
senha, token, peso, observações ou outros dados de treino em solicitações de
suporte.

Este documento descreve a implementação técnica e não substitui revisão jurídica
aplicável aos países de distribuição.

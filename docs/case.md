# Aprova — case em desenvolvimento

## Problema
Freelancers recebem feedback espalhado por conversas e arquivos com nomes semelhantes. Uma aprovação sem referência clara pode acabar aplicada à versão errada.

## Solução construída
O freelancer publica uma imagem, compartilha um link e acompanha pedidos de ajuste. Novas versões preservam esse endereço e o histórico. O cliente aprova a versão que revisou, sem criar uma conta.

## Decisões
- Inter, fundo escuro e verde-limão para a ação principal.
- Cards com título e data; ações e histórico revelados sob demanda.
- Toasts para confirmações temporárias; pedidos de ajuste permanecem no histórico.
- Skeletons preservam a estrutura durante o carregamento.
- Movimento de 160–240 ms para orientar mudanças, com suporte a movimento reduzido.
- Imagem anterior permanece visível durante a troca de versão.
- Upload com preview, limite explícito e validação no servidor.
- Atualização do painel a cada 30 segundos, pausada quando a aba está oculta, offline, ocupada ou com foco em formulário.

## Arquitetura
Next.js App Router + React + TypeScript. Server Actions validam sessão e propriedade. Supabase Auth identifica o freelancer; Postgres mantém entregas, versões e decisões; Storage privado guarda imagens. RLS limita leituras ao dono. Operações de revisão passam pelo servidor usando o hash do token. RPCs serializam decisões e novas versões com lock da entrega.

## Evidências
- Build de produção e TypeScript passaram.
- Testes de integração verificam isolamento entre duas contas, bloqueio de RPC anônima, feedback persistido, publicação concorrente com números únicos, rejeição de versão antiga, aprovação idempotente, revogação e expiração.
- Fixtures e usuários de integração são removidos ao final.
- Fluxo da demo simulada percorrido no navegador até aprovação da V2.

## Limites atuais
A demo em /demo é uma simulação local sem persistência; não substitui a validação do backend. /conheca apresenta o produto. Publicação depende de autenticação da Vercel. Ainda falta teste independente com pessoa externa e mobile físico. Não há métricas de usuários ou resultados comerciais medidos. Webhooks não estão implementados.

## Roteiro de teste externo
Sem instruções adicionais: publicar uma imagem, abrir o link como cliente, solicitar ajuste, publicar V2, aprovar e localizar o histórico. Registrar dúvidas, erros, dispositivo e tempo de conclusão. Não inventar resultados.

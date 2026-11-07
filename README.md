# Aprova

Plataforma de revisão de trabalhos criativos. O freelancer publica uma entrega e o cliente abre a imagem por um link de revisão.

**Status: em desenvolvimento.**

[Protótipo do Aprova no Figma](https://www.figma.com/design/4Fv4LJ6mgh5O88D2TaZSLp?node-id=7-2)

## Rodar localmente

1. Use Node.js 24 e rode `npm ci`.
2. Em um projeto Supabase de desenvolvimento, aplique a migração em `supabase/migrations/` no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha a URL, a chave publicável e a chave secreta do Supabase. A chave secreta é usada somente no servidor.
4. Crie um usuário de teste confirmado em **Authentication → Users**.
5. Rode `npm run dev` e abra `http://localhost:3000`.

Entre no painel, publique uma imagem PNG, JPEG ou WebP de até 3 MB e abra o link em uma janela anônima. O token só é exibido na confirmação de publicação. A entrega guarda o hash do token, que expira em sete dias. Revogar o link bloqueia novas visualizações. Uma URL de imagem emitida anteriormente expira em até 60 segundos.

## Marcos para o portfólio

O percentual representa marcos aceitos, com 20 pontos por marco.

- [x] Protótipo desktop/mobile no Figma com o fluxo de revisão.
- [ ] V1 publicada e aberta pelo cliente em ambiente integrado, com revogação verificada.
- [ ] Comentário por versão, publicação de V2 e aprovação com histórico.
- [ ] Demo publicada e testada com outra pessoa em desktop e mobile.
- [ ] Case no portfólio com landing page, motion e demonstração do webhook.

O código do upload inicial está em desenvolvimento. Comentários, troca de versão, aprovação e webhooks fazem parte dos próximos marcos.

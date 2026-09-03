# Memória Reflexiva

Base greenfield do aplicativo Memória Reflexiva, com Next.js App Router e
Supabase SSR.

## Desenvolvimento local

1. Copie `.env.example` para `.env.local` e preencha as duas variáveis.
2. Instale as dependências com `npm install`.
3. Execute `npm run dev`.

## Integração Supabase

- `src/utils/supabase/client.ts`: cliente para componentes no navegador.
- `src/utils/supabase/server.ts`: cliente para Server Components, Server Actions e rotas.
- `src/utils/supabase/proxy.ts`: renovação de sessão e propagação segura de cookies.
- `src/proxy.ts`: ponto de entrada do Proxy no Next.js 16.

Somente a URL e a chave publicável usam o prefixo `NEXT_PUBLIC_`. Nunca adicione
uma chave secreta ou `service_role` ao frontend.

## Comandos

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

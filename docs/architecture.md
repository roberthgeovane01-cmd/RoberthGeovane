# Arquitetura

O Memória Reflexiva usa Next.js App Router na Vercel e Supabase para Auth,
PostgreSQL, Row Level Security e Storage privado.

O fluxo intelectual obrigatório é:

1. áudio e transcrição;
2. revisão humana;
3. investigação da biblioteca;
4. evidências e conflitos;
5. dossiê de memória;
6. escrita orientada pelo perfil de estilo;
7. edição, aprovação e voz.

As áreas de leitura usam Server Components. Mutações internas usarão Server
Actions autenticadas, e integrações externas usarão Route Handlers ou workers.
Nenhum provedor de IA recebe chaves pelo navegador.

## Limites atuais

As fases 0 e 1 estabelecem infraestrutura, Auth, schema, isolamento e navegação.
Biblioteca, processamento, retrieval, áudio e geração permanecem desativados até
suas fases específicas possuírem testes de aceitação.

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

As áreas de leitura usam Server Components. Mutações internas usam Server
Actions autenticadas, e integrações externas usam Route Handlers ou workers.
Nenhum provedor de IA recebe chaves pelo navegador.

## Ingestão da Biblioteca

1. o navegador valida tamanho, extensão e MIME e calcula o SHA-256;
2. uma Server Action autenticada valida tudo novamente, aplica RLS e reserva a
   fonte, a versão e um caminho privado exclusivo;
3. arquivos até 6 MB usam upload padrão; arquivos maiores usam TUS retomável;
4. o servidor baixa o original pelo cliente autenticado, recalcula o hash e
   valida a assinatura do conteúdo;
5. PDF textual, DOCX, TXT e Markdown são normalizados em seções rastreáveis;
6. PDFs sem texto útil ficam em `ocr_required` e não seguem para a memória;
7. o resultado final é registrado em `processing_jobs`.

O bucket `library-originals` é privado. O download ocorre por rota autenticada
que emite uma URL assinada de curta duração depois de uma leitura protegida por
RLS. O original e o texto derivado permanecem separados.

## Limites atuais

As fases 0 a 2 estabelecem infraestrutura, Auth, schema, isolamento, navegação e
ingestão documental inicial. Chunking semântico, embeddings, retrieval, áudio e
geração permanecem desativados até suas fases específicas possuírem testes de
aceitação.

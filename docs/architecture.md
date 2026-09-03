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

## Construção da memória

1. uma Server Action autentica novamente o usuário e registra o consentimento;
2. um Workflow durável divide o trabalho em etapas persistentes e repetíveis;
3. as seções geram chunks determinísticos com hash e localização na fonte;
4. o Gateway produz embeddings e saídas estruturadas em lotes pequenos;
5. resumos, conceitos e claims registram modelo, prompt e versão usados;
6. cada claim só é persistido quando a evidência citada existe literalmente no
   chunk original;
7. o documento só recebe `memory_status = ready` após a finalização integral.

O conteúdo documental é sempre tratado como dado não confiável. Os prompts
proíbem obedecer instruções existentes nos arquivos e não permitem acrescentar
fatos externos.

## Limites atuais

As fases 0 a 3 estabelecem infraestrutura, Auth, schema, isolamento, ingestão e
memória documental estruturada. Retrieval, áudio e geração de reflexões
permanecem desativados até suas fases específicas possuírem testes de aceitação.

# Memória Reflexiva

Aplicativo de biblioteca, memória investigativa e escrita reflexiva. O princípio
do produto é **memória antes da escrita**: nenhuma reflexão deve ser gerada antes
da revisão da fala, da recuperação de fontes e da análise de evidências e
conflitos.

## Estado atual

As fases de inicialização, fundação Supabase, Biblioteca, memória estruturada e
recuperação híbrida estão implementadas:

- Next.js 16, React 19, TypeScript e Tailwind CSS;
- componentes no padrão shadcn/ui;
- Supabase Auth com sessão SSR;
- 41 tabelas de domínio;
- Row Level Security por workspace;
- pgvector, busca textual em português e índices HNSW;
- três buckets privados;
- upload de PDF textual, DOCX, TXT e Markdown até 50 MB;
- upload retomável, hash SHA-256 e bloqueio de duplicados;
- preservação privada do original e download por URL temporária;
- extração estruturada e retenção segura de PDFs que exigem OCR;
- chunking determinístico com hashes, localizadores e contagem estimada de tokens;
- resumos por seção e por fonte com prompts centralizados e versionados;
- embeddings compatíveis por espaço de modelo, dimensão e versão;
- conceitos candidatos e afirmações ligadas a evidências literais;
- processamento durável, idempotente, retomável e com progresso visível;
- busca lexical e vetorial em três níveis, com fusão RRF e multi-consulta;
- filtros, reranqueamento, diversidade por fonte e trilha de auditoria dos descartes;
- rotas-base da aplicação;
- testes, formatação, lint, TypeScript, build e CI.

A próxima entrega é a Fase 5: classificação de evidências, conflitos e dossiê.

## Desenvolvimento local

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave publicável do projeto Supabase.
3. Instale e valide:

```bash
npm ci
npm run check
npm run build
npm run dev
```

## Variáveis

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
AI_GATEWAY_API_KEY=
ANALYSIS_MODEL=openai/gpt-5.6-luna
EMBEDDING_MODEL=openai/text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

Nunca coloque uma chave secreta ou `service_role` em uma variável
`NEXT_PUBLIC_`. Na Vercel, o AI Gateway pode usar a identidade OIDC do projeto;
`AI_GATEWAY_API_KEY` continua disponível para ambientes sem OIDC.

## Estrutura

- `src/app`: rotas públicas, autenticação e área protegida;
- `src/components`: shell e componentes de interface;
- `src/lib`: validações, constantes e utilitários;
- `src/workflows`: processamento durável da memória documental;
- `src/utils/supabase`: clientes de navegador, servidor e proxy;
- `src/types/database.ts`: tipos gerados do schema remoto;
- `supabase/migrations`: fonte de verdade do banco;
- `docs`: arquitetura, banco, segurança, operação e roadmap.

## Documentação

- [Arquitetura](docs/architecture.md)
- [Banco de dados](docs/database.md)
- [Segurança](docs/security.md)
- [Operações](docs/operations.md)
- [Roadmap](docs/roadmap.md)

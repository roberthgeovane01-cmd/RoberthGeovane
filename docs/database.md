# Banco de dados

O schema canônico contém 41 tabelas de domínio, agrupadas em identidade,
biblioteca, memória, investigação, áudio/reflexão, estilo/voz e infraestrutura.

## Convenções

- Identificadores públicos usam UUID.
- Dados de usuário carregam `workspace_id`, `created_by`, `status`, `created_at`
  e `updated_at`.
- Toda chave estrangeira possui índice de cobertura.
- Chunks, claims, memories e style examples usam vetores de 1.536 dimensões.
- Busca lexical usa `tsvector` em português e índice GIN.
- Busca semântica usa pgvector e índices HNSW com distância de cosseno.
- `embedding_spaces` registra provedor, modelo, dimensão e versão; apenas um
  espaço pode estar ativo por workspace.
- Chunks têm hash canônico, localizador, versão do chunker e método de contagem.
- Resumos e claims registram o prompt e o modelo que os produziram.
- Claims usam `claim_evidence` para preservar trecho e chunk de origem.
- Mudanças estruturais são realizadas somente por migrações versionadas.

Os arquivos em `supabase/migrations` são a fonte de verdade do schema remoto.

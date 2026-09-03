# Banco de dados

O schema canônico contém 39 tabelas de domínio, agrupadas em identidade,
biblioteca, memória, investigação, áudio/reflexão, estilo/voz e infraestrutura.

## Convenções

- Identificadores públicos usam UUID.
- Dados de usuário carregam `workspace_id`, `created_by`, `status`, `created_at`
  e `updated_at`.
- Toda chave estrangeira possui índice de cobertura.
- Chunks, claims, memories e style examples usam vetores de 1.536 dimensões.
- Busca lexical usa `tsvector` em português e índice GIN.
- Busca semântica usa pgvector e índices HNSW com distância de cosseno.
- Mudanças estruturais são realizadas somente por migrações versionadas.

Os arquivos em `supabase/migrations` são a fonte de verdade do schema remoto.

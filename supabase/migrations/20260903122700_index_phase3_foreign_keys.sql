create index claims_embedding_space_id_fk_idx
  on public.claims (embedding_space_id);

create index claims_prompt_version_id_fk_idx
  on public.claims (prompt_version_id);

create index concepts_embedding_space_id_fk_idx
  on public.concepts (embedding_space_id);

create index embedding_spaces_created_by_fk_idx
  on public.embedding_spaces (created_by);

create index source_chunks_embedding_space_id_fk_idx
  on public.source_chunks (embedding_space_id);

create index source_summaries_prompt_version_id_fk_idx
  on public.source_summaries (prompt_version_id);

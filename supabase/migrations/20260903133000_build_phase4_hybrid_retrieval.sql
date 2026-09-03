-- Phase 4 — traceable hierarchical hybrid retrieval.

alter table public.sources
  add column authority_level smallint not null default 3
    check (authority_level between 1 and 5),
  add column valid_from date,
  add column valid_until date,
  add constraint sources_valid_period_check
    check (valid_until is null or valid_from is null or valid_until >= valid_from);

alter table public.source_summaries
  add column embedding extensions.vector(1536),
  add column embedding_space_id uuid references public.embedding_spaces(id) on delete restrict,
  add column search_vector tsvector generated always as
    (to_tsvector('portuguese', coalesce(content, ''))) stored,
  add constraint source_summaries_embedding_space_check
    check (
      (embedding is null and embedding_space_id is null)
      or (embedding is not null and embedding_space_id is not null)
    );

create index source_summaries_search_idx
  on public.source_summaries using gin (search_vector);
create index source_summaries_embedding_idx
  on public.source_summaries using hnsw (embedding extensions.vector_cosine_ops);
create index source_summaries_embedding_space_id_fk_idx
  on public.source_summaries (embedding_space_id);

alter table public.retrieval_queries
  add column embedding_space_id uuid references public.embedding_spaces(id) on delete restrict,
  add column parameters jsonb not null default '{}'::jsonb,
  add constraint retrieval_queries_embedding_space_check
    check (
      (embedding is null and embedding_space_id is null)
      or (embedding is not null and embedding_space_id is not null)
    );

alter table public.retrieval_hits
  add column source_id uuid references public.sources(id) on delete cascade,
  add column source_section_id uuid references public.source_sections(id) on delete set null,
  add column source_summary_id uuid references public.source_summaries(id) on delete cascade,
  add column retrieval_level text check (retrieval_level in ('global', 'intermediate', 'evidence')),
  add column rrf_score real,
  add column authority_score real,
  add column temporal_score real,
  add column specificity_score real,
  add column diversity_penalty real not null default 0;

alter table public.retrieval_hits
  drop constraint retrieval_hits_check,
  add constraint retrieval_hits_single_entity_check
    check (num_nonnulls(source_chunk_id, claim_id, memory_id, source_summary_id) = 1);

create index retrieval_queries_embedding_space_id_fk_idx
  on public.retrieval_queries (embedding_space_id);
create index retrieval_hits_source_id_fk_idx on public.retrieval_hits (source_id);
create index retrieval_hits_section_id_fk_idx on public.retrieval_hits (source_section_id);
create index retrieval_hits_summary_id_fk_idx on public.retrieval_hits (source_summary_id);

create or replace function public.search_memory_hybrid(
  p_workspace_id uuid,
  p_query_text text,
  p_query_embedding extensions.vector(1536) default null,
  p_embedding_space_id uuid default null,
  p_source_ids uuid[] default null,
  p_match_count integer default 30,
  p_rrf_k integer default 60
)
returns table (
  entity_id uuid,
  entity_type text,
  retrieval_level text,
  source_id uuid,
  source_section_id uuid,
  content text,
  lexical_score real,
  vector_score real,
  rrf_score real,
  authority_level smallint,
  valid_from date,
  valid_until date
)
language sql
stable
security invoker
set search_path = ''
as $$
  with candidates as (
    select ss.id, 'source_summary'::text as entity_type,
      case when ss.summary_kind in ('source', 'version') then 'global' else 'intermediate' end as retrieval_level,
      ss.source_id, ss.source_section_id, ss.content, ss.search_vector, ss.embedding,
      s.authority_level, s.valid_from, s.valid_until
    from public.source_summaries ss
    join public.sources s on s.id = ss.source_id
    where ss.workspace_id = p_workspace_id and ss.status = 'active'
      and (p_source_ids is null or ss.source_id = any(p_source_ids))
      and (p_embedding_space_id is null or ss.embedding_space_id = p_embedding_space_id)
    union all
    select sc.id, 'source_chunk', 'evidence', sc.source_id, sc.source_section_id,
      sc.content, sc.search_vector, sc.embedding, s.authority_level, s.valid_from, s.valid_until
    from public.source_chunks sc
    join public.sources s on s.id = sc.source_id
    where sc.workspace_id = p_workspace_id and sc.status = 'active'
      and (p_source_ids is null or sc.source_id = any(p_source_ids))
      and (p_embedding_space_id is null or sc.embedding_space_id = p_embedding_space_id)
    union all
    select c.id, 'claim', 'evidence', c.source_id, c.source_section_id,
      c.statement, c.search_vector, c.embedding, s.authority_level, s.valid_from, s.valid_until
    from public.claims c
    join public.sources s on s.id = c.source_id
    where c.workspace_id = p_workspace_id and c.status in ('candidate', 'verified')
      and (p_source_ids is null or c.source_id = any(p_source_ids))
      and (p_embedding_space_id is null or c.embedding_space_id = p_embedding_space_id)
  ), lexical as (
    select c.id, ts_rank_cd(c.search_vector, websearch_to_tsquery('portuguese', p_query_text))::real as score,
      row_number() over (order by ts_rank_cd(c.search_vector, websearch_to_tsquery('portuguese', p_query_text)) desc, c.id) as rank
    from candidates c
    where nullif(btrim(p_query_text), '') is not null
      and c.search_vector @@ websearch_to_tsquery('portuguese', p_query_text)
    order by score desc limit least(greatest(p_match_count * 3, 1), 300)
  ), semantic as (
    select c.id, (1 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding))::real as score,
      row_number() over (order by c.embedding OPERATOR(extensions.<=>) p_query_embedding, c.id) as rank
    from candidates c
    where p_query_embedding is not null and c.embedding is not null
    order by c.embedding OPERATOR(extensions.<=>) p_query_embedding
    limit least(greatest(p_match_count * 3, 1), 300)
  )
  select c.id, c.entity_type, c.retrieval_level, c.source_id, c.source_section_id, c.content,
    l.score, sem.score,
    ((case when l.rank is null then 0 else 1.0 / (p_rrf_k + l.rank) end) +
     (case when sem.rank is null then 0 else 1.0 / (p_rrf_k + sem.rank) end))::real,
    c.authority_level, c.valid_from, c.valid_until
  from candidates c
  left join lexical l on l.id = c.id
  left join semantic sem on sem.id = c.id
  where l.id is not null or sem.id is not null
  order by 9 desc, greatest(coalesce(l.score, 0), coalesce(sem.score, 0)) desc, c.id
  limit least(greatest(p_match_count, 1), 100);
$$;

revoke all on function public.search_memory_hybrid(uuid, text, extensions.vector, uuid, uuid[], integer, integer)
  from public, anon;
grant execute on function public.search_memory_hybrid(uuid, text, extensions.vector, uuid, uuid[], integer, integer)
  to authenticated;

comment on function public.search_memory_hybrid is
  'RLS-protected Portuguese FTS + cosine vector retrieval fused with reciprocal rank fusion.';

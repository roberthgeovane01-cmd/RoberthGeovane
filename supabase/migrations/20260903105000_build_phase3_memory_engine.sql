-- Phase 3: durable, traceable memory processing and embedding-space safety.

create extension if not exists pgcrypto with schema extensions;

create table public.embedding_spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 120),
  model text not null check (char_length(model) between 1 and 240),
  dimensions integer not null check (dimensions = 1536),
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'superseded', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, model, dimensions, version)
);

create unique index embedding_spaces_one_active_idx
  on public.embedding_spaces (workspace_id)
  where status = 'active';

create index embedding_spaces_workspace_idx
  on public.embedding_spaces (workspace_id, status);

create trigger embedding_spaces_set_updated_at
before update on public.embedding_spaces
for each row execute function private.set_updated_at();

alter table public.embedding_spaces enable row level security;

create policy embedding_spaces_select_member on public.embedding_spaces
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy embedding_spaces_insert_admin on public.embedding_spaces
  for insert to authenticated
  with check (
    (select private.is_workspace_admin(workspace_id))
    and created_by = (select auth.uid())
  );

create policy embedding_spaces_update_admin on public.embedding_spaces
  for update to authenticated
  using ((select private.is_workspace_admin(workspace_id)))
  with check ((select private.is_workspace_admin(workspace_id)));

create policy embedding_spaces_delete_admin on public.embedding_spaces
  for delete to authenticated
  using ((select private.is_workspace_admin(workspace_id)));

revoke all on public.embedding_spaces from anon;
grant select, insert, update, delete on public.embedding_spaces to authenticated;
grant all on public.embedding_spaces to service_role;

alter table public.source_versions
  add column memory_status text not null default 'pending'
    check (memory_status in ('pending', 'processing', 'waiting_for_ai', 'ready', 'failed', 'blocked')),
  add column memory_revision integer not null default 0 check (memory_revision >= 0),
  add column memory_built_at timestamptz,
  add column memory_error text;

update public.source_versions
set memory_status = case
  when extraction_status = 'ocr_required' then 'blocked'
  when extraction_status = 'ready' then 'pending'
  else 'pending'
end;

alter table public.source_chunks
  add column content_hash text,
  add column chunker_version integer not null default 1 check (chunker_version > 0),
  add column embedding_space_id uuid references public.embedding_spaces(id) on delete restrict;

update public.source_chunks
set content_hash = encode(extensions.digest(convert_to(content, 'UTF8'), 'sha256'), 'hex');

alter table public.source_chunks
  alter column content_hash set not null,
  add constraint source_chunks_content_hash_check
    check (content_hash ~ '^[a-f0-9]{64}$'),
  add constraint source_chunks_embedding_space_check
    check (
      (embedding is null and embedding_space_id is null)
      or (embedding is not null and embedding_space_id is not null)
    );

create index source_chunks_embedding_space_idx
  on public.source_chunks (workspace_id, embedding_space_id)
  where embedding is not null and status = 'active';

alter table public.concepts
  add column embedding_space_id uuid references public.embedding_spaces(id) on delete restrict,
  add constraint concepts_embedding_space_check
    check (
      (embedding is null and embedding_space_id is null)
      or (embedding is not null and embedding_space_id is not null)
    );

create index concepts_embedding_space_idx
  on public.concepts (workspace_id, embedding_space_id)
  where embedding is not null and status in ('candidate', 'active');

alter table public.source_summaries
  add column prompt_version_id uuid references public.prompt_versions(id) on delete set null,
  add column model_provider text,
  add column content_hash text;

update public.source_summaries
set content_hash = encode(extensions.digest(convert_to(content, 'UTF8'), 'sha256'), 'hex');

alter table public.source_summaries
  alter column content_hash set not null,
  add constraint source_summaries_content_hash_check
    check (content_hash ~ '^[a-f0-9]{64}$');

create unique index source_summaries_one_active_section_idx
  on public.source_summaries (source_section_id, summary_kind)
  where source_section_id is not null and status = 'active';

create unique index source_summaries_one_active_version_idx
  on public.source_summaries (source_version_id, summary_kind)
  where source_version_id is not null
    and source_section_id is null
    and status = 'active';

alter table public.claims
  add column claim_hash text,
  add column version integer not null default 1 check (version > 0),
  add column prompt_version_id uuid references public.prompt_versions(id) on delete set null,
  add column embedding_space_id uuid references public.embedding_spaces(id) on delete restrict;

update public.claims
set claim_hash = encode(extensions.digest(convert_to(statement, 'UTF8'), 'sha256'), 'hex');

alter table public.claims
  alter column claim_hash set not null,
  add constraint claims_hash_check
    check (claim_hash ~ '^[a-f0-9]{64}$'),
  add constraint claims_embedding_space_check
    check (
      (embedding is null and embedding_space_id is null)
      or (embedding is not null and embedding_space_id is not null)
    );

create unique index claims_version_hash_idx
  on public.claims (source_version_id, claim_hash, version)
  where source_version_id is not null;

create index claims_embedding_space_idx
  on public.claims (workspace_id, embedding_space_id)
  where embedding is not null and status in ('candidate', 'verified');

create unique index claim_evidence_unique_source_idx
  on public.claim_evidence (claim_id, source_chunk_id, evidence_type)
  where source_chunk_id is not null;

alter table public.processing_jobs
  add column correlation_id uuid not null default gen_random_uuid(),
  add column current_step text,
  add column progress numeric(5,4) not null default 0 check (progress between 0 and 1);

create index processing_jobs_correlation_idx
  on public.processing_jobs (workspace_id, correlation_id);

grant update on public.processing_jobs to authenticated;

create policy processing_jobs_update_member on public.processing_jobs
  for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));

comment on table public.embedding_spaces is
  'One active embedding coordinate space per workspace; retrieval must filter by embedding_space_id.';
comment on column public.source_chunks.content_hash is
  'SHA-256 of canonical chunk text for deterministic idempotency.';
comment on column public.source_versions.memory_status is
  'Memory build state, independent from raw text extraction state.';

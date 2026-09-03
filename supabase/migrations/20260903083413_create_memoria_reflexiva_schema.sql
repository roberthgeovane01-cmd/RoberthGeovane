-- Memória Reflexiva — canonical domain schema.
-- The vector dimension is fixed at 1536 for the first embedding provider.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 500),
  source_type text not null check (source_type in ('book', 'document', 'article', 'note', 'web', 'other')),
  language text not null default 'pt-BR',
  author_name text,
  publication_year integer check (publication_year is null or publication_year between 1 and 9999),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'uploading', 'processing', 'ready', 'failed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  version integer not null check (version > 0),
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  extraction_status text not null default 'queued' check (extraction_status in ('queued', 'processing', 'ready', 'failed', 'needs_ocr')),
  extracted_text text,
  page_count integer check (page_count is null or page_count >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'superseded', 'failed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, version),
  unique (workspace_id, sha256)
);

create table public.source_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_version_id uuid not null references public.source_versions(id) on delete cascade,
  parent_section_id uuid references public.source_sections(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  level integer not null default 0 check (level between 0 and 12),
  heading text,
  locator jsonb not null default '{}'::jsonb,
  content text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'excluded', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_version_id, ordinal)
);

create table public.source_summaries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_version_id uuid references public.source_versions(id) on delete cascade,
  source_section_id uuid references public.source_sections(id) on delete cascade,
  summary_kind text not null check (summary_kind in ('source', 'version', 'section', 'chapter')),
  content text not null,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('draft', 'active', 'superseded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_version_id uuid not null references public.source_versions(id) on delete cascade,
  source_section_id uuid references public.source_sections(id) on delete set null,
  ordinal integer not null check (ordinal >= 0),
  content text not null,
  token_count integer check (token_count is null or token_count >= 0),
  embedding extensions.vector(1536),
  search_vector tsvector generated always as (to_tsvector('portuguese', coalesce(content, ''))) stored,
  locator jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'excluded', 'failed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_version_id, ordinal)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null,
  color text,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.source_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, tag_id)
);

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  normalized_name text not null,
  description text,
  embedding extensions.vector(1536),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('candidate', 'active', 'merged', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, normalized_name)
);

create table public.source_concepts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  relevance numeric(5,4) check (relevance is null or relevance between 0 and 1),
  evidence jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('candidate', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, concept_id)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid references public.sources(id) on delete cascade,
  source_version_id uuid references public.source_versions(id) on delete cascade,
  source_section_id uuid references public.source_sections(id) on delete set null,
  statement text not null,
  claim_type text not null default 'factual' check (claim_type in ('factual', 'interpretive', 'normative', 'autobiographical', 'hypothesis')),
  confidence numeric(5,4) not null default 0.5 check (confidence between 0 and 1),
  embedding extensions.vector(1536),
  search_vector tsvector generated always as (to_tsvector('portuguese', coalesce(statement, ''))) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'candidate' check (status in ('candidate', 'verified', 'disputed', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  source_chunk_id uuid references public.source_chunks(id) on delete cascade,
  evidence_type text not null default 'direct' check (evidence_type in ('direct', 'indirect', 'contextual', 'counterevidence')),
  excerpt text,
  locator jsonb not null default '{}'::jsonb,
  strength numeric(5,4) check (strength is null or strength between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('candidate', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_claim_id uuid not null references public.claims(id) on delete cascade,
  target_claim_id uuid not null references public.claims(id) on delete cascade,
  relation_type text not null check (relation_type in ('supports', 'contradicts', 'refines', 'duplicates', 'contextualizes')),
  confidence numeric(5,4) not null default 0.5 check (confidence between 0 and 1),
  rationale text,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'candidate' check (status in ('candidate', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_claim_id <> target_claim_id),
  unique (source_claim_id, target_claim_id, relation_type)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  memory_type text not null check (memory_type in ('knowledge', 'autobiographical', 'value', 'context', 'feedback', 'operational')),
  title text not null check (char_length(title) between 1 and 500),
  content text not null,
  canonicality numeric(5,4) not null default 0.5 check (canonicality between 0 and 1),
  confidence numeric(5,4) not null default 0.5 check (confidence between 0 and 1),
  embedding extensions.vector(1536),
  search_vector tsvector generated always as (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, ''))) stored,
  metadata jsonb not null default '{}'::jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'candidate' check (status in ('candidate', 'active', 'superseded', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);

create table public.memory_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_memory_id uuid not null references public.memories(id) on delete cascade,
  target_memory_id uuid not null references public.memories(id) on delete cascade,
  relation_type text not null check (relation_type in ('supports', 'contradicts', 'updates', 'depends_on', 'related_to')),
  weight numeric(5,4) not null default 0.5 check (weight between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('candidate', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_memory_id <> target_memory_id),
  unique (source_memory_id, target_memory_id, relation_type)
);

create table public.retrieval_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_query text not null,
  parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create table public.retrieval_queries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  retrieval_session_id uuid not null references public.retrieval_sessions(id) on delete cascade,
  query_type text not null check (query_type in ('original', 'lexical', 'semantic', 'hierarchical', 'expansion')),
  query_text text not null,
  embedding extensions.vector(1536),
  ordinal integer not null default 0 check (ordinal >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'failed', 'excluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retrieval_session_id, ordinal)
);

create table public.retrieval_hits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  retrieval_session_id uuid not null references public.retrieval_sessions(id) on delete cascade,
  retrieval_query_id uuid references public.retrieval_queries(id) on delete cascade,
  source_chunk_id uuid references public.source_chunks(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  memory_id uuid references public.memories(id) on delete cascade,
  entity_type text not null check (entity_type in ('source_chunk', 'claim', 'memory', 'source_summary')),
  lexical_score real,
  vector_score real,
  rerank_score real,
  final_score real,
  rank integer check (rank is null or rank > 0),
  selected boolean not null default false,
  rationale text,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'candidate' check (status in ('candidate', 'selected', 'excluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(source_chunk_id, claim_id, memory_id) <= 1)
);

create table public.memory_dossiers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  retrieval_session_id uuid not null references public.retrieval_sessions(id) on delete cascade,
  title text not null,
  question text not null,
  executive_summary text,
  dossier jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dossier_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  memory_dossier_id uuid not null references public.memory_dossiers(id) on delete cascade,
  retrieval_hit_id uuid references public.retrieval_hits(id) on delete set null,
  evidence_type text not null check (evidence_type in ('fact', 'interpretation', 'memory', 'value', 'counterevidence')),
  stance text not null default 'neutral' check (stance in ('supports', 'contradicts', 'neutral', 'qualifies')),
  excerpt text not null,
  locator jsonb not null default '{}'::jsonb,
  relevance numeric(5,4) check (relevance is null or relevance between 0 and 1),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'candidate' check (status in ('candidate', 'selected', 'excluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conflicts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  memory_dossier_id uuid references public.memory_dossiers(id) on delete cascade,
  left_claim_id uuid references public.claims(id) on delete set null,
  right_claim_id uuid references public.claims(id) on delete set null,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  conflict_type text not null check (conflict_type in ('factual', 'temporal', 'interpretive', 'value', 'source')),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'review', 'resolved', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (left_claim_id is null or right_claim_id is null or left_claim_id <> right_claim_id)
);

create table public.conflict_resolutions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conflict_id uuid not null references public.conflicts(id) on delete cascade,
  resolution_type text not null check (resolution_type in ('prefer_left', 'prefer_right', 'synthesize', 'preserve_tension', 'insufficient_evidence', 'dismiss')),
  notes text not null,
  resolved_by uuid not null references auth.users(id) on delete restrict,
  resolved_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audio_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  mime_type text not null,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  recorded_at timestamptz,
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'uploaded' check (status in ('uploading', 'uploaded', 'transcribing', 'review', 'ready', 'failed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sha256)
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  audio_entry_id uuid not null references public.audio_entries(id) on delete cascade,
  version integer not null check (version > 0),
  raw_text text not null,
  approved_text text,
  language text not null default 'pt-BR',
  provider text,
  model text,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audio_entry_id, version),
  check (status <> 'approved' or (approved_text is not null and approved_at is not null and approved_by is not null))
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  summary text,
  occurred_from timestamptz,
  occurred_until timestamptz,
  people jsonb not null default '[]'::jsonb,
  places jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (occurred_until is null or occurred_from is null or occurred_until >= occurred_from)
);

create table public.reflection_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  audio_entry_id uuid references public.audio_entries(id) on delete set null,
  transcript_id uuid references public.transcripts(id) on delete set null,
  episode_id uuid references public.episodes(id) on delete set null,
  retrieval_session_id uuid references public.retrieval_sessions(id) on delete set null,
  memory_dossier_id uuid references public.memory_dossiers(id) on delete set null,
  current_step text not null default 'capture' check (current_step in ('capture', 'transcript_review', 'investigation', 'dossier_review', 'writing', 'editing', 'approval', 'voice', 'complete')),
  context jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'active', 'blocked', 'complete', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_session_id uuid not null references public.reflection_sessions(id) on delete cascade,
  title text not null,
  synopsis text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'approved' or (approved_at is not null and approved_by is not null))
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  prompt_key text not null,
  version integer not null check (version > 0),
  role text not null check (role in ('system', 'developer', 'user', 'evaluator')),
  content text not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'active', 'superseded', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, prompt_key, version)
);

create table public.reflection_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  version integer not null check (version > 0),
  content text not null,
  prompt_version_id uuid references public.prompt_versions(id) on delete set null,
  writer_provider text,
  writer_model text,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reflection_id, version)
);

create table public.reflection_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_version_id uuid not null references public.reflection_versions(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  source_chunk_id uuid references public.source_chunks(id) on delete set null,
  claim_id uuid references public.claims(id) on delete set null,
  memory_id uuid references public.memories(id) on delete set null,
  citation_order integer not null check (citation_order > 0),
  quoted_text text,
  locator jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'excluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(source_id, source_chunk_id, claim_id, memory_id) >= 1),
  unique (reflection_version_id, citation_order)
);

create table public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  version integer not null default 1 check (version > 0),
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'active', 'superseded', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name, version)
);

create table public.style_examples (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  style_profile_id uuid not null references public.style_profiles(id) on delete cascade,
  title text,
  content text not null,
  notes text,
  embedding extensions.vector(1536),
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('candidate', 'active', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  provider text not null,
  provider_voice_id text not null,
  settings jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  consent_log_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'active', 'disabled', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, provider_voice_id)
);

create table public.reflection_audio_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_version_id uuid not null references public.reflection_versions(id) on delete cascade,
  voice_profile_id uuid references public.voice_profiles(id) on delete set null,
  version integer not null check (version > 0),
  storage_path text not null,
  mime_type text not null,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  provider text,
  model text,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'processing' check (status in ('queued', 'processing', 'ready', 'failed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reflection_version_id, version)
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  error_message text,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued', 'processing', 'retry', 'complete', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key),
  check (attempt_count <= max_attempts)
);

create table public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'voice', 'ai_processing', 'data_retention')),
  granted boolean not null,
  policy_version text not null,
  evidence jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'recorded' check (status in ('recorded', 'redacted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.voice_profiles
  add constraint voice_profiles_consent_log_id_fkey
  foreign key (consent_log_id) references public.consent_logs(id) on delete set null;

-- Core helper functions live outside the exposed schema.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members member
      where member.workspace_id = target_workspace_id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    );
$$;

create or replace function private.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members member
      where member.workspace_id = target_workspace_id
        and member.user_id = (select auth.uid())
        and member.role in ('owner', 'admin')
        and member.status = 'active'
    );
$$;

create or replace function private.can_write_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members member
      where member.workspace_id = target_workspace_id
        and member.user_id = (select auth.uid())
        and member.role in ('owner', 'admin', 'member')
        and member.status = 'active'
    );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members member
      where member.workspace_id = target_workspace_id
        and member.user_id = (select auth.uid())
        and member.role = 'owner'
        and member.status = 'active'
    );
$$;

create or replace function private.storage_workspace_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  candidate text;
begin
  candidate := split_part(object_name, '/', 1);
  if candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return candidate::uuid;
  end if;
  return null;
end;
$$;

create or replace function private.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, created_by, status)
  values (new.id, new.created_by, 'owner', new.created_by, 'active')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  preferred_name text;
begin
  preferred_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Meu espaço'
  );

  insert into public.profiles (id, display_name)
  values (new.id, preferred_name)
  on conflict (id) do nothing;

  insert into public.workspaces (name, slug, created_by)
  values (preferred_name, 'workspace-' || substr(replace(new.id::text, '-', ''), 1, 12), new.id);

  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke execute on function private.add_workspace_owner() from public, anon, authenticated, service_role;
revoke execute on function private.handle_new_user() from public, anon, authenticated, service_role;
revoke execute on function private.is_workspace_member(uuid) from public, anon, service_role;
revoke execute on function private.is_workspace_admin(uuid) from public, anon, service_role;
revoke execute on function private.can_write_workspace(uuid) from public, anon, service_role;
revoke execute on function private.is_workspace_owner(uuid) from public, anon, service_role;
revoke execute on function private.storage_workspace_id(text) from public, anon, service_role;

grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_admin(uuid) to authenticated;
grant execute on function private.can_write_workspace(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.storage_workspace_id(text) to authenticated;

create trigger workspaces_add_owner
after insert on public.workspaces
for each row execute function private.add_workspace_owner();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'workspaces', 'workspace_members', 'sources', 'source_versions',
    'source_sections', 'source_summaries', 'source_chunks', 'tags', 'source_tags',
    'concepts', 'source_concepts', 'claims', 'claim_evidence', 'claim_relations',
    'memories', 'memory_relations', 'retrieval_sessions', 'retrieval_queries',
    'retrieval_hits', 'memory_dossiers', 'dossier_evidence', 'conflicts',
    'conflict_resolutions', 'audio_entries', 'transcripts', 'episodes',
    'reflection_sessions', 'reflections', 'reflection_versions', 'reflection_sources',
    'reflection_audio_versions', 'style_profiles', 'style_examples', 'voice_profiles',
    'processing_jobs', 'prompt_versions', 'consent_logs', 'audit_logs'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

-- Foreign keys and RLS predicates receive explicit indexes.
create index workspace_members_user_id_idx on public.workspace_members (user_id, workspace_id) where status = 'active';
create index sources_workspace_status_idx on public.sources (workspace_id, status, updated_at desc);
create index source_versions_source_id_idx on public.source_versions (source_id, version desc);
create index source_sections_version_parent_idx on public.source_sections (source_version_id, parent_section_id, ordinal);
create index source_summaries_source_id_idx on public.source_summaries (source_id, source_version_id);
create index source_chunks_source_id_idx on public.source_chunks (source_id, source_version_id, ordinal);
create index source_chunks_section_id_idx on public.source_chunks (source_section_id);
create index source_chunks_search_idx on public.source_chunks using gin (search_vector);
create index source_chunks_embedding_idx on public.source_chunks using hnsw (embedding extensions.vector_cosine_ops);
create index source_tags_tag_id_idx on public.source_tags (tag_id);
create index source_concepts_concept_id_idx on public.source_concepts (concept_id);
create index claims_source_id_idx on public.claims (source_id, source_version_id);
create index claims_section_id_idx on public.claims (source_section_id);
create index claims_search_idx on public.claims using gin (search_vector);
create index claims_embedding_idx on public.claims using hnsw (embedding extensions.vector_cosine_ops);
create index claim_evidence_claim_id_idx on public.claim_evidence (claim_id);
create index claim_evidence_chunk_id_idx on public.claim_evidence (source_chunk_id);
create index claim_relations_target_idx on public.claim_relations (target_claim_id);
create index memories_workspace_type_idx on public.memories (workspace_id, memory_type, status);
create index memories_search_idx on public.memories using gin (search_vector);
create index memories_embedding_idx on public.memories using hnsw (embedding extensions.vector_cosine_ops);
create index memory_relations_target_idx on public.memory_relations (target_memory_id);
create index retrieval_sessions_workspace_idx on public.retrieval_sessions (workspace_id, created_at desc);
create index retrieval_queries_session_idx on public.retrieval_queries (retrieval_session_id);
create index retrieval_hits_session_rank_idx on public.retrieval_hits (retrieval_session_id, rank);
create index retrieval_hits_query_idx on public.retrieval_hits (retrieval_query_id);
create index retrieval_hits_chunk_idx on public.retrieval_hits (source_chunk_id);
create index retrieval_hits_claim_idx on public.retrieval_hits (claim_id);
create index retrieval_hits_memory_idx on public.retrieval_hits (memory_id);
create index memory_dossiers_session_idx on public.memory_dossiers (retrieval_session_id);
create index dossier_evidence_dossier_idx on public.dossier_evidence (memory_dossier_id);
create index conflicts_dossier_idx on public.conflicts (memory_dossier_id, status);
create index conflicts_left_claim_idx on public.conflicts (left_claim_id);
create index conflicts_right_claim_idx on public.conflicts (right_claim_id);
create index conflict_resolutions_conflict_idx on public.conflict_resolutions (conflict_id, created_at desc);
create index audio_entries_workspace_idx on public.audio_entries (workspace_id, created_at desc);
create index transcripts_audio_idx on public.transcripts (audio_entry_id, version desc);
create index reflection_sessions_workspace_idx on public.reflection_sessions (workspace_id, updated_at desc);
create index reflection_sessions_audio_idx on public.reflection_sessions (audio_entry_id);
create index reflection_sessions_transcript_idx on public.reflection_sessions (transcript_id);
create index reflection_sessions_retrieval_idx on public.reflection_sessions (retrieval_session_id);
create index reflection_sessions_dossier_idx on public.reflection_sessions (memory_dossier_id);
create index reflections_session_idx on public.reflections (reflection_session_id);
create index reflection_versions_reflection_idx on public.reflection_versions (reflection_id, version desc);
create index reflection_versions_prompt_idx on public.reflection_versions (prompt_version_id);
create index reflection_sources_version_idx on public.reflection_sources (reflection_version_id);
create index reflection_sources_source_idx on public.reflection_sources (source_id);
create index reflection_sources_chunk_idx on public.reflection_sources (source_chunk_id);
create index reflection_sources_claim_idx on public.reflection_sources (claim_id);
create index reflection_sources_memory_idx on public.reflection_sources (memory_id);
create index style_profiles_workspace_idx on public.style_profiles (workspace_id, active) where status = 'active';
create index style_examples_profile_idx on public.style_examples (style_profile_id);
create index style_examples_embedding_idx on public.style_examples using hnsw (embedding extensions.vector_cosine_ops);
create index voice_profiles_workspace_idx on public.voice_profiles (workspace_id, active) where status = 'active';
create index voice_profiles_consent_idx on public.voice_profiles (consent_log_id);
create index reflection_audio_version_idx on public.reflection_audio_versions (reflection_version_id, version desc);
create index reflection_audio_voice_idx on public.reflection_audio_versions (voice_profile_id);
create index processing_jobs_queue_idx on public.processing_jobs (status, run_after) where status in ('queued', 'retry');
create index prompt_versions_active_idx on public.prompt_versions (workspace_id, prompt_key) where status = 'active';
create index consent_logs_workspace_idx on public.consent_logs (workspace_id, consent_type, created_at desc);
create index audit_logs_workspace_idx on public.audit_logs (workspace_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

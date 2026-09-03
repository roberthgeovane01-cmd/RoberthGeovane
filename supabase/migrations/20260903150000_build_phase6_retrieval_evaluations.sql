-- Phase 6 — isolated, repeatable retrieval and dossier evaluations.

create table public.retrieval_evaluations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 200),
  dataset_version text not null,
  retrieval_version text not null,
  metrics jsonb not null,
  case_results jsonb not null default '[]'::jsonb,
  parameters jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'complete' check (status in ('running', 'complete', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retrieval_evaluations enable row level security;
revoke all on public.retrieval_evaluations from anon;
grant select, insert on public.retrieval_evaluations to authenticated;

create policy retrieval_evaluations_select_member on public.retrieval_evaluations for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy retrieval_evaluations_insert_writer on public.retrieval_evaluations for insert to authenticated with check ((select private.can_write_workspace(workspace_id)) and created_by = (select auth.uid()));

create index retrieval_evaluations_workspace_created_idx on public.retrieval_evaluations (workspace_id, created_at desc);
create index retrieval_evaluations_created_by_fk_idx on public.retrieval_evaluations (created_by);

comment on table public.retrieval_evaluations is 'Aggregate and per-case results; synthetic corpus stays outside real memory tables.';

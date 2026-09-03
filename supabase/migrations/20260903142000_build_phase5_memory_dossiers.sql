-- Phase 5 — evidence classification, conflict review and traceable dossiers.

alter table public.memory_dossiers
  drop constraint memory_dossiers_status_check,
  add constraint memory_dossiers_status_check
    check (status in ('draft', 'review', 'needs_conflict_review', 'approved', 'rejected', 'superseded')),
  add column analyst_model text,
  add column prompt_version text not null default 'memory-analyst-v1',
  add column evidence_coverage numeric(5,4) check (evidence_coverage between 0 and 1);

alter table public.dossier_evidence
  drop constraint dossier_evidence_stance_check,
  add constraint dossier_evidence_stance_check
    check (stance in ('supports', 'complements', 'contradicts', 'neutral', 'qualifies', 'unrelated')),
  add column classification_rationale text;

alter table public.conflicts
  add column left_retrieval_hit_id uuid references public.retrieval_hits(id) on delete set null,
  add column right_retrieval_hit_id uuid references public.retrieval_hits(id) on delete set null,
  add column blocks_writing boolean not null default false;

create index conflicts_left_retrieval_hit_id_fk_idx on public.conflicts (left_retrieval_hit_id);
create index conflicts_right_retrieval_hit_id_fk_idx on public.conflicts (right_retrieval_hit_id);

comment on column public.conflicts.blocks_writing is
  'True only when human review is required before any literary generation.';

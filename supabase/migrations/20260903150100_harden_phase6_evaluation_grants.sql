-- Defense in depth for projects that auto-expose new public tables.
revoke all on table public.retrieval_evaluations from anon;
grant select, insert on table public.retrieval_evaluations to authenticated;

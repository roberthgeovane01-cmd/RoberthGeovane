create table public.todos (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 160),
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

revoke all on table public.todos from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.todos to anon, authenticated;

create policy "todos_public_read"
  on public.todos
  for select
  to anon, authenticated
  using (true);

insert into public.todos (name, is_complete)
values
  ('Projeto Next.js inicializado', true),
  ('Supabase SSR configurado', true),
  ('Implantar na Vercel', false);

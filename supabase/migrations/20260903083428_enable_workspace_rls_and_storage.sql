-- Memória Reflexiva — tenant isolation, explicit Data API grants, and private Storage.

create or replace function private.preserve_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by = old.created_by;
  return new;
end;
$$;

revoke execute on function private.preserve_created_by() from public, anon, authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'workspaces', 'workspace_members', 'sources', 'source_versions', 'source_sections',
    'source_summaries', 'source_chunks', 'tags', 'source_tags', 'concepts',
    'source_concepts', 'claims', 'claim_evidence', 'claim_relations', 'memories',
    'memory_relations', 'retrieval_sessions', 'retrieval_queries', 'retrieval_hits',
    'memory_dossiers', 'dossier_evidence', 'conflicts', 'conflict_resolutions',
    'audio_entries', 'transcripts', 'episodes', 'reflection_sessions', 'reflections',
    'reflection_versions', 'reflection_sources', 'reflection_audio_versions',
    'style_profiles', 'style_examples', 'voice_profiles', 'processing_jobs',
    'prompt_versions', 'consent_logs', 'audit_logs'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.preserve_created_by()',
      table_name || '_preserve_created_by',
      table_name
    );
  end loop;
end;
$$;

-- No domain table is anonymously accessible. Roles opt in explicitly because
-- new Supabase projects no longer auto-expose public tables to the Data API.
revoke all on table
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.sources,
  public.source_versions,
  public.source_sections,
  public.source_summaries,
  public.source_chunks,
  public.tags,
  public.source_tags,
  public.concepts,
  public.source_concepts,
  public.claims,
  public.claim_evidence,
  public.claim_relations,
  public.memories,
  public.memory_relations,
  public.retrieval_sessions,
  public.retrieval_queries,
  public.retrieval_hits,
  public.memory_dossiers,
  public.dossier_evidence,
  public.conflicts,
  public.conflict_resolutions,
  public.audio_entries,
  public.transcripts,
  public.episodes,
  public.reflection_sessions,
  public.reflections,
  public.reflection_versions,
  public.reflection_sources,
  public.reflection_audio_versions,
  public.style_profiles,
  public.style_examples,
  public.voice_profiles,
  public.processing_jobs,
  public.prompt_versions,
  public.consent_logs,
  public.audit_logs
from anon;

grant usage on schema public to authenticated, service_role;
grant select, insert, update on public.profiles to authenticated;

grant select, insert, update, delete on table
  public.workspaces,
  public.workspace_members,
  public.sources,
  public.source_versions,
  public.source_sections,
  public.source_summaries,
  public.source_chunks,
  public.tags,
  public.source_tags,
  public.concepts,
  public.source_concepts,
  public.claims,
  public.claim_evidence,
  public.claim_relations,
  public.memories,
  public.memory_relations,
  public.retrieval_sessions,
  public.retrieval_queries,
  public.retrieval_hits,
  public.memory_dossiers,
  public.dossier_evidence,
  public.conflicts,
  public.conflict_resolutions,
  public.audio_entries,
  public.transcripts,
  public.episodes,
  public.reflection_sessions,
  public.reflections,
  public.reflection_versions,
  public.reflection_sources,
  public.reflection_audio_versions,
  public.style_profiles,
  public.style_examples,
  public.voice_profiles,
  public.prompt_versions
to authenticated;

grant select, insert on table
  public.processing_jobs,
  public.consent_logs,
  public.audit_logs
to authenticated;

grant all on all tables in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy workspaces_select_member on public.workspaces
  for select to authenticated
  using ((select private.is_workspace_member(id)));

create policy workspaces_insert_owner on public.workspaces
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy workspaces_update_admin on public.workspaces
  for update to authenticated
  using ((select private.is_workspace_admin(id)))
  with check ((select private.is_workspace_admin(id)));

create policy workspaces_delete_owner on public.workspaces
  for delete to authenticated
  using ((select private.is_workspace_owner(id)));

create policy workspace_members_select_member on public.workspace_members
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy workspace_members_insert_admin on public.workspace_members
  for insert to authenticated
  with check (
    (select private.is_workspace_admin(workspace_id))
    and created_by = (select auth.uid())
  );

create policy workspace_members_update_admin on public.workspace_members
  for update to authenticated
  using ((select private.is_workspace_admin(workspace_id)))
  with check ((select private.is_workspace_admin(workspace_id)));

create policy workspace_members_delete_admin on public.workspace_members
  for delete to authenticated
  using ((select private.is_workspace_admin(workspace_id)));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sources', 'source_versions', 'source_sections', 'source_summaries', 'source_chunks',
    'tags', 'source_tags', 'concepts', 'source_concepts', 'claims', 'claim_evidence',
    'claim_relations', 'memories', 'memory_relations', 'retrieval_sessions',
    'retrieval_queries', 'retrieval_hits', 'memory_dossiers', 'dossier_evidence',
    'conflicts', 'conflict_resolutions', 'audio_entries', 'transcripts', 'episodes',
    'reflection_sessions', 'reflections', 'reflection_versions', 'reflection_sources',
    'reflection_audio_versions', 'style_profiles', 'style_examples', 'voice_profiles'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_workspace_member(workspace_id)))',
      table_name || '_select_member',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.can_write_workspace(workspace_id)) and created_by = (select auth.uid()))',
      table_name || '_insert_member',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.can_write_workspace(workspace_id))) with check ((select private.can_write_workspace(workspace_id)))',
      table_name || '_update_member',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.can_write_workspace(workspace_id)))',
      table_name || '_delete_member',
      table_name
    );
  end loop;
end;
$$;

alter table public.prompt_versions enable row level security;
create policy prompt_versions_select_member on public.prompt_versions
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy prompt_versions_insert_admin on public.prompt_versions
  for insert to authenticated
  with check ((select private.is_workspace_admin(workspace_id)) and created_by = (select auth.uid()));
create policy prompt_versions_update_admin on public.prompt_versions
  for update to authenticated
  using ((select private.is_workspace_admin(workspace_id)))
  with check ((select private.is_workspace_admin(workspace_id)));
create policy prompt_versions_delete_admin on public.prompt_versions
  for delete to authenticated
  using ((select private.is_workspace_admin(workspace_id)));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['processing_jobs', 'consent_logs', 'audit_logs']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_workspace_member(workspace_id)))',
      table_name || '_select_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.can_write_workspace(workspace_id)) and created_by = (select auth.uid()))',
      table_name || '_insert_member',
      table_name
    );
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'library-originals',
    'library-originals',
    false,
    104857600,
    array['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'audio-originals',
    'audio-originals',
    false,
    104857600,
    array['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav', 'audio/x-wav', 'audio/ogg']
  ),
  (
    'audio-generated',
    'audio-generated',
    false,
    52428800,
    array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_select_workspace_member on storage.objects
  for select to authenticated
  using (
    bucket_id in ('library-originals', 'audio-originals', 'audio-generated')
    and (select private.is_workspace_member(private.storage_workspace_id(name)))
  );

create policy storage_insert_workspace_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('library-originals', 'audio-originals', 'audio-generated')
    and (select private.can_write_workspace(private.storage_workspace_id(name)))
    and owner_id = (select auth.uid()::text)
  );

create policy storage_update_workspace_member on storage.objects
  for update to authenticated
  using (
    bucket_id in ('library-originals', 'audio-originals', 'audio-generated')
    and (select private.can_write_workspace(private.storage_workspace_id(name)))
  )
  with check (
    bucket_id in ('library-originals', 'audio-originals', 'audio-generated')
    and (select private.can_write_workspace(private.storage_workspace_id(name)))
    and owner_id = (select auth.uid()::text)
  );

create policy storage_delete_workspace_member on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('library-originals', 'audio-originals', 'audio-generated')
    and (select private.can_write_workspace(private.storage_workspace_id(name)))
  );

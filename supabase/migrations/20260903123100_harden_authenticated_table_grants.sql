-- RLS does not govern TRUNCATE. REFERENCES and TRIGGER are also unnecessary
-- for the Data API role, so remove only these elevated operations while
-- preserving the application's existing row-level CRUD grants.
revoke truncate, references, trigger
  on all tables in schema public
  from authenticated;

-- Preserve the intentionally narrower contracts of infrastructure tables.
revoke delete on public.profiles from authenticated;
revoke delete on public.processing_jobs from authenticated;
revoke update, delete on table
  public.consent_logs,
  public.audit_logs
from authenticated;

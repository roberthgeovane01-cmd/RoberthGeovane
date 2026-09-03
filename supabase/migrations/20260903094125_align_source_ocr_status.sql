-- Align the persisted OCR state with the canonical product plan.

update public.source_versions
set extraction_status = 'ocr_required'
where extraction_status = 'needs_ocr';

alter table public.source_versions
  drop constraint source_versions_extraction_status_check;

alter table public.source_versions
  add constraint source_versions_extraction_status_check
  check (
    extraction_status in (
      'queued',
      'processing',
      'ready',
      'failed',
      'ocr_required'
    )
  );

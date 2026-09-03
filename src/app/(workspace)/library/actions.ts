"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { extractDocument } from "@/lib/library/extract-document";
import {
  canonicalDocumentMimeType,
  prepareSourceUploadSchema,
  sanitizeStorageFilename,
  type PrepareSourceUploadInput,
} from "@/lib/library/file-rules";
import { createClient } from "@/utils/supabase/server";

const preparedSourceSchema = z.object({
  sourceId: z.uuid(),
  versionId: z.uuid(),
});

type ActionFailure = {
  code?: "duplicate" | "unauthenticated";
  message: string;
  ok: false;
  sourceId?: string;
};

type PreparedUpload = {
  objectPath: string;
  ok: true;
  sourceId: string;
  versionId: string;
  workspaceId: string;
};

async function getWorkspaceContext() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || !userId) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!workspace) return null;
  return { supabase, userId, workspaceId: workspace.id };
}

function extractionErrorMessage(error: unknown) {
  if (!(error instanceof Error))
    return "Não foi possível extrair este arquivo.";
  if (error.message === "invalid_pdf_signature") {
    return "O conteúdo não corresponde a um PDF válido.";
  }
  if (error.message === "invalid_docx_signature") {
    return "O conteúdo não corresponde a um DOCX válido.";
  }
  if (error.message === "binary_text_file") {
    return "O arquivo de texto contém dados binários e não foi processado.";
  }
  if (error.message === "empty_text") {
    return "O documento não contém texto utilizável.";
  }
  if (error.message === "hash_mismatch") {
    return "A verificação de integridade do arquivo falhou.";
  }
  return "Não foi possível extrair o texto do documento.";
}

async function sha256Hex(arrayBuffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function prepareSourceUpload(
  input: PrepareSourceUploadInput,
): Promise<ActionFailure | PreparedUpload> {
  const parsed = prepareSourceUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "Dados do documento inválidos.",
      ok: false,
    };
  }

  const context = await getWorkspaceContext();
  if (!context) {
    return {
      code: "unauthenticated",
      message: "Sua sessão expirou. Entre novamente.",
      ok: false,
    };
  }

  const { supabase, userId, workspaceId } = context;
  const mimeType = canonicalDocumentMimeType(
    parsed.data.originalFilename,
    parsed.data.mimeType,
  );
  const { data: duplicate } = await supabase
    .from("source_versions")
    .select("source_id")
    .eq("workspace_id", workspaceId)
    .eq("sha256", parsed.data.sha256)
    .maybeSingle();

  if (duplicate) {
    return {
      code: "duplicate",
      message: "Este mesmo arquivo já existe na Biblioteca.",
      ok: false,
      sourceId: duplicate.source_id,
    };
  }

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      author_name: parsed.data.authorName || null,
      created_by: userId,
      language: "pt-BR",
      metadata: { ingestion: "library-upload-v1" },
      publication_year: parsed.data.publicationYear ?? null,
      source_type: parsed.data.sourceType,
      status: "uploading",
      title: parsed.data.title,
      workspace_id: workspaceId,
    })
    .select("id")
    .single();

  if (sourceError || !source) {
    return { message: "Não foi possível preparar o documento.", ok: false };
  }

  const objectPath = `${workspaceId}/${source.id}/${crypto.randomUUID()}-${sanitizeStorageFilename(parsed.data.originalFilename)}`;
  const { data: version, error: versionError } = await supabase
    .from("source_versions")
    .insert({
      byte_size: parsed.data.byteSize,
      created_by: userId,
      extraction_status: "queued",
      mime_type: mimeType,
      original_filename: parsed.data.originalFilename,
      sha256: parsed.data.sha256,
      source_id: source.id,
      status: "active",
      storage_path: objectPath,
      version: 1,
      workspace_id: workspaceId,
    })
    .select("id")
    .single();

  if (versionError || !version) {
    await supabase.from("sources").delete().eq("id", source.id);
    return {
      message:
        versionError?.code === "23505"
          ? "Este mesmo arquivo já existe na Biblioteca."
          : "Não foi possível registrar a versão do documento.",
      ok: false,
    };
  }

  return {
    objectPath,
    ok: true,
    sourceId: source.id,
    versionId: version.id,
    workspaceId,
  };
}

export async function cancelPreparedSource(input: {
  sourceId: string;
  versionId: string;
}) {
  const parsed = preparedSourceSchema.safeParse(input);
  if (!parsed.success) return;

  const context = await getWorkspaceContext();
  if (!context) return;

  const { data: version } = await context.supabase
    .from("source_versions")
    .select("storage_path")
    .eq("id", parsed.data.versionId)
    .eq("source_id", parsed.data.sourceId)
    .maybeSingle();

  if (version?.storage_path) {
    const { error } = await context.supabase.storage
      .from("library-originals")
      .remove([version.storage_path]);
    if (error) return;
  }
  await context.supabase
    .from("sources")
    .delete()
    .eq("id", parsed.data.sourceId);
}

export async function processUploadedSource(input: {
  sourceId: string;
  versionId: string;
}): Promise<
  | ActionFailure
  | { message: string; ok: true; quality: "good" | "ocr_required" }
> {
  const parsed = preparedSourceSchema.safeParse(input);
  if (!parsed.success) {
    return { message: "Documento inválido.", ok: false };
  }

  const context = await getWorkspaceContext();
  if (!context) {
    return {
      code: "unauthenticated",
      message: "Sua sessão expirou. Entre novamente.",
      ok: false,
    };
  }

  const { supabase, userId, workspaceId } = context;
  const { data: version } = await supabase
    .from("source_versions")
    .select(
      "id, original_filename, sha256, source_id, storage_path, extraction_status",
    )
    .eq("id", parsed.data.versionId)
    .eq("source_id", parsed.data.sourceId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!version) {
    return { message: "A versão do documento não foi encontrada.", ok: false };
  }

  if (
    version.extraction_status === "ready" ||
    version.extraction_status === "ocr_required"
  ) {
    return {
      message:
        version.extraction_status === "ocr_required"
          ? "O original já foi preservado e aguarda OCR."
          : "O documento já foi processado.",
      ok: true,
      quality:
        version.extraction_status === "ocr_required" ? "ocr_required" : "good",
    };
  }

  const { data: claimedVersion, error: claimError } = await supabase
    .from("source_versions")
    .update({ extraction_status: "processing" })
    .eq("id", version.id)
    .in("extraction_status", ["queued", "failed"])
    .select("id")
    .maybeSingle();

  if (claimError) {
    return { message: "Não foi possível iniciar a extração.", ok: false };
  }
  if (!claimedVersion) {
    return { message: "Este documento já está sendo processado.", ok: false };
  }

  try {
    const { error: sourceStatusError } = await supabase
      .from("sources")
      .update({ status: "processing" })
      .eq("id", version.source_id);
    if (sourceStatusError) throw new Error("source_update_failed");

    const { data: file, error: downloadError } = await supabase.storage
      .from("library-originals")
      .download(version.storage_path);
    if (downloadError || !file) throw new Error("download_failed");

    const arrayBuffer = await file.arrayBuffer();
    const verifiedHash = await sha256Hex(arrayBuffer);
    if (verifiedHash !== version.sha256) throw new Error("hash_mismatch");

    const extraction = await extractDocument(
      arrayBuffer,
      version.original_filename,
    );

    await supabase
      .from("source_sections")
      .delete()
      .eq("source_version_id", version.id);

    for (let index = 0; index < extraction.sections.length; index += 100) {
      const batch = extraction.sections
        .slice(index, index + 100)
        .map((section) => ({
          content: section.content,
          created_by: userId,
          heading: section.heading,
          level: section.level,
          locator: section.locator,
          ordinal: section.ordinal,
          source_version_id: version.id,
          status: "active" as const,
          workspace_id: workspaceId,
        }));
      if (batch.length === 0) continue;

      const { error } = await supabase.from("source_sections").insert(batch);
      if (error) throw new Error("section_insert_failed");
    }

    const extractionStatus =
      extraction.quality === "ocr_required" ? "ocr_required" : "ready";
    const { error: versionUpdateError } = await supabase
      .from("source_versions")
      .update({
        extracted_text: extraction.extractedText || null,
        extraction_status: extractionStatus,
        page_count: extraction.pageCount,
      })
      .eq("id", version.id);
    if (versionUpdateError) throw new Error("version_update_failed");

    const { error: sourceUpdateError } = await supabase
      .from("sources")
      .update({
        metadata: {
          ingestion: "library-upload-v1",
          extraction_quality: extraction.quality,
          extraction_warnings: extraction.warnings,
          section_count: extraction.sections.length,
        },
        status: extraction.quality === "ocr_required" ? "processing" : "ready",
      })
      .eq("id", version.source_id);
    if (sourceUpdateError) throw new Error("source_update_failed");

    const { error: jobInsertError } = await supabase
      .from("processing_jobs")
      .insert({
        completed_at: new Date().toISOString(),
        created_by: userId,
        entity_id: version.id,
        entity_type: "source_version",
        idempotency_key: `extract:${version.id}:${version.sha256}`,
        job_type: "source_extraction",
        result: {
          extraction_status: extractionStatus,
          section_count: extraction.sections.length,
          warnings: extraction.warnings,
        },
        status: "complete",
        workspace_id: workspaceId,
      });
    if (jobInsertError) throw new Error("job_insert_failed");

    revalidatePath("/library");
    revalidatePath(`/library/${version.source_id}`);

    return {
      message:
        extraction.quality === "ocr_required"
          ? "Original preservado. Este PDF precisa de OCR antes de entrar na memória."
          : "Documento preservado e texto extraído com sucesso.",
      ok: true,
      quality: extraction.quality,
    };
  } catch (error) {
    const message = extractionErrorMessage(error);
    await Promise.all([
      supabase
        .from("source_versions")
        .update({ extraction_status: "failed", status: "failed" })
        .eq("id", version.id),
      supabase
        .from("sources")
        .update({ status: "failed" })
        .eq("id", version.source_id),
      supabase.from("processing_jobs").insert({
        completed_at: new Date().toISOString(),
        created_by: userId,
        entity_id: version.id,
        entity_type: "source_version",
        error_message: message,
        idempotency_key: `extract-failed:${version.id}:${version.sha256}`,
        job_type: "source_extraction",
        status: "failed",
        workspace_id: workspaceId,
      }),
    ]);

    revalidatePath("/library");
    return { message, ok: false };
  }
}

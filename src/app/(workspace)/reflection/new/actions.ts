"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prepareAudioSchema, sanitizeAudioFilename } from "@/lib/audio/rules";
import {
  GatewaySpeechToTextProvider,
  isTranscriptionConfigured,
} from "@/lib/audio/transcription";
import { createClient } from "@/utils/supabase/server";

type Failure = { message: string; ok: false };

async function getContext() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return workspace ? { supabase, userId, workspaceId: workspace.id } : null;
}

async function sha256Hex(value: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function prepareAudioUpload(
  input: z.input<typeof prepareAudioSchema>,
): Promise<Failure | { audioId: string; objectPath: string; ok: true }> {
  const parsed = prepareAudioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Áudio inválido.",
      ok: false,
    };
  }
  const context = await getContext();
  if (!context) return { message: "Sua sessão expirou.", ok: false };

  const duplicate = await context.supabase
    .from("audio_entries")
    .select("id")
    .eq("workspace_id", context.workspaceId)
    .eq("sha256", parsed.data.sha256)
    .maybeSingle();
  if (duplicate.data) {
    return { message: "Este áudio já está na sua memória.", ok: false };
  }

  const audioId = crypto.randomUUID();
  const objectPath = `${context.workspaceId}/audio/${audioId}-${sanitizeAudioFilename(parsed.data.originalFilename)}`;
  const { error } = await context.supabase.from("audio_entries").insert({
    byte_size: parsed.data.byteSize,
    created_by: context.userId,
    duration_ms: parsed.data.durationMs ?? null,
    id: audioId,
    metadata: { capture: "reflection-v1" },
    mime_type: parsed.data.mimeType,
    original_filename: parsed.data.originalFilename,
    recorded_at: new Date().toISOString(),
    sha256: parsed.data.sha256,
    status: "uploading",
    storage_path: objectPath,
    workspace_id: context.workspaceId,
  });
  if (error) {
    return { message: "Não foi possível preparar o áudio.", ok: false };
  }
  return { audioId, objectPath, ok: true };
}

export async function cancelAudioUpload(audioId: string) {
  const parsed = z.uuid().safeParse(audioId);
  const context = await getContext();
  if (!parsed.success || !context) return;
  const { data: audio } = await context.supabase
    .from("audio_entries")
    .select("storage_path")
    .eq("id", parsed.data)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!audio) return;
  await context.supabase.storage
    .from("audio-originals")
    .remove([audio.storage_path]);
  await context.supabase.from("audio_entries").delete().eq("id", parsed.data);
}

export async function transcribeUploadedAudio(
  audioId: string,
): Promise<Failure | { ok: true; transcriptId: string }> {
  const parsed = z.uuid().safeParse(audioId);
  const context = await getContext();
  if (!parsed.success || !context) {
    return { message: "Áudio inválido.", ok: false };
  }
  const { data: audio } = await context.supabase
    .from("audio_entries")
    .select("id, storage_path, sha256")
    .eq("id", parsed.data)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!audio) return { message: "Áudio não encontrado.", ok: false };
  if (!isTranscriptionConfigured()) {
    await context.supabase
      .from("audio_entries")
      .update({ status: "failed" })
      .eq("id", audio.id);
    return {
      message: "O provedor de transcrição ainda não está configurado.",
      ok: false,
    };
  }

  await context.supabase
    .from("audio_entries")
    .update({ status: "transcribing" })
    .eq("id", audio.id);
  try {
    const downloaded = await context.supabase.storage
      .from("audio-originals")
      .download(audio.storage_path);
    if (downloaded.error || !downloaded.data) {
      throw new Error("download_failed");
    }
    const buffer = await downloaded.data.arrayBuffer();
    if (audio.sha256 && (await sha256Hex(buffer)) !== audio.sha256) {
      throw new Error("hash_mismatch");
    }
    const result = await new GatewaySpeechToTextProvider().transcribe(
      new Uint8Array(buffer),
    );
    if (!result.text) throw new Error("empty_transcript");
    const inserted = await context.supabase
      .from("transcripts")
      .insert({
        audio_entry_id: audio.id,
        created_by: context.userId,
        language: result.language === "pt" ? "pt-BR" : result.language,
        model: result.model,
        provider: result.provider,
        raw_text: result.text,
        status: "review",
        version: 1,
        workspace_id: context.workspaceId,
      })
      .select("id")
      .single();
    if (inserted.error) throw new Error("transcript_insert_failed");
    await context.supabase
      .from("audio_entries")
      .update({ duration_ms: result.durationMs, status: "review" })
      .eq("id", audio.id);
    revalidatePath("/reflection/new");
    return { ok: true, transcriptId: inserted.data.id };
  } catch {
    await context.supabase
      .from("audio_entries")
      .update({ status: "failed" })
      .eq("id", audio.id);
    return {
      message:
        "A transcrição falhou. O áudio original foi preservado para nova tentativa.",
      ok: false,
    };
  }
}

const approvalSchema = z.object({
  audioId: z.uuid(),
  approvedText: z.string().trim().min(10).max(100_000),
  transcriptId: z.uuid(),
});

export async function approveTranscript(formData: FormData) {
  const parsed = approvalSchema.safeParse({
    audioId: formData.get("audioId"),
    approvedText: formData.get("approvedText"),
    transcriptId: formData.get("transcriptId"),
  });
  if (!parsed.success) return;
  const context = await getContext();
  if (!context) return;
  const approvedAt = new Date().toISOString();
  const updated = await context.supabase
    .from("transcripts")
    .update({
      approved_at: approvedAt,
      approved_by: context.userId,
      approved_text: parsed.data.approvedText,
      status: "approved",
    })
    .eq("id", parsed.data.transcriptId)
    .eq("audio_entry_id", parsed.data.audioId)
    .eq("workspace_id", context.workspaceId)
    .select("id")
    .maybeSingle();
  if (!updated.data) return;
  await context.supabase
    .from("audio_entries")
    .update({ status: "ready" })
    .eq("id", parsed.data.audioId);
  redirect("/review");
}

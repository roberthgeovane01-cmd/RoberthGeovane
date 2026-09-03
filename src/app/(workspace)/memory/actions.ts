"use server";

import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { z } from "zod";

import {
  getMemoryAiConfig,
  isAiGatewayConfigured,
} from "@/lib/memory/ai-config";
import { buildSourceMemoryWorkflow } from "@/workflows/build-source-memory";
import { createClient } from "@/utils/supabase/server";

const buildMemorySchema = z.object({
  consent: z.literal(true),
  sourceId: z.uuid(),
  versionId: z.uuid(),
});

type BuildMemoryResult =
  { message: string; ok: false } | { message: string; ok: true; runId: string };

export async function startSourceMemoryBuild(input: {
  consent: boolean;
  sourceId: string;
  versionId: string;
}): Promise<BuildMemoryResult> {
  const parsed = buildMemorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      message: "Confirme o processamento por IA para construir a memória.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || !userId) {
    return { message: "Sua sessão expirou. Entre novamente.", ok: false };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!workspace) {
    return { message: "O espaço de trabalho não foi encontrado.", ok: false };
  }

  const { data: version, error: versionError } = await supabase
    .from("source_versions")
    .select(
      "id, source_id, sha256, extraction_status, memory_status, memory_revision",
    )
    .eq("id", parsed.data.versionId)
    .eq("source_id", parsed.data.sourceId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (versionError || !version) {
    return { message: "A versão do documento não foi encontrada.", ok: false };
  }
  if (version.extraction_status === "ocr_required") {
    return {
      message: "Este documento precisa de OCR antes de entrar na memória.",
      ok: false,
    };
  }
  if (version.extraction_status !== "ready") {
    return {
      message: "A extração do texto ainda não foi concluída.",
      ok: false,
    };
  }
  if (version.memory_status === "processing") {
    return {
      message: "A memória deste documento já está em construção.",
      ok: false,
    };
  }

  // getClaims above performs the authorization decision. The session is read
  // only to pass its short-lived access token to least-privilege workflow steps.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    return { message: "Sua sessão precisa ser renovada.", ok: false };
  }

  const revision = version.memory_revision + 1;
  const config = getMemoryAiConfig();
  const idempotencyKey = `memory:${version.id}:${version.sha256}:r${revision}`;
  const { data: job, error: jobError } = await supabase
    .from("processing_jobs")
    .insert({
      created_by: userId,
      current_step: "queued",
      entity_id: version.id,
      entity_type: "source_version",
      idempotency_key: idempotencyKey,
      job_type: "source_memory_build",
      payload: {
        analysis_model: config.analysisModel,
        embedding_dimensions: config.embeddingSpace.dimensions,
        embedding_model: config.embeddingModel,
        memory_revision: revision,
      },
      progress: 0,
      status: "queued",
      workspace_id: workspace.id,
    })
    .select("id")
    .single();
  if (jobError || !job) {
    return {
      message:
        jobError?.code === "23505"
          ? "Este processamento já foi solicitado."
          : "Não foi possível criar o processamento da memória.",
      ok: false,
    };
  }

  const { data: claimed, error: claimError } = await supabase
    .from("source_versions")
    .update({
      memory_error: null,
      memory_revision: revision,
      memory_status: "processing",
    })
    .eq("id", version.id)
    .neq("memory_status", "processing")
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    await supabase
      .from("processing_jobs")
      .update({ status: "cancelled" })
      .eq("id", job.id);
    return { message: "A memória já está sendo processada.", ok: false };
  }

  await Promise.all([
    supabase
      .from("sources")
      .update({ status: "processing" })
      .eq("id", version.source_id),
    supabase.from("consent_logs").insert({
      consent_type: "ai_processing",
      created_by: userId,
      evidence: {
        job_id: job.id,
        source_id: version.source_id,
        source_version_id: version.id,
      },
      granted: true,
      policy_version: "ai-processing-v1",
      workspace_id: workspace.id,
    }),
  ]);

  try {
    const run = await start(buildSourceMemoryWorkflow, [
      {
        accessToken: sessionData.session.access_token,
        aiEnabled: isAiGatewayConfigured(),
        jobId: job.id,
        revision,
        sourceId: version.source_id,
        userId,
        versionId: version.id,
        workspaceId: workspace.id,
      },
    ]);
    await supabase
      .from("processing_jobs")
      .update({
        current_step: "workflow_started",
        locked_by: `vercel-workflow:${run.runId}`,
        status: "processing",
      })
      .eq("id", job.id);

    revalidatePath("/library");
    revalidatePath(`/library/${version.source_id}`);
    revalidatePath("/memory");
    return {
      message: isAiGatewayConfigured()
        ? "Construção da memória iniciada. O processo continua com segurança em segundo plano."
        : "Indexação iniciada. Os chunks serão preservados enquanto a IA aguarda configuração.",
      ok: true,
      runId: run.runId,
    };
  } catch {
    const message = "Não foi possível iniciar o processamento durável.";
    await Promise.all([
      supabase
        .from("source_versions")
        .update({ memory_error: message, memory_status: "failed" })
        .eq("id", version.id),
      supabase
        .from("processing_jobs")
        .update({
          completed_at: new Date().toISOString(),
          current_step: "failed_to_start",
          error_message: message,
          status: "failed",
        })
        .eq("id", job.id),
    ]);
    return { message, ok: false };
  }
}

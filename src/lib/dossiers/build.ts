import type { SupabaseClient } from "@supabase/supabase-js";

import {
  classifyEvidence,
  synthesizeDossier,
  type AnalystEvidence,
} from "./analyst";
import { hasBlockingConflict, validateDossierReferences } from "./schemas";
import { getMemoryAiConfig } from "@/lib/memory/ai-config";
import type { Database } from "@/types/database";

export async function buildMemoryDossier(
  supabase: SupabaseClient<Database>,
  input: { retrievalSessionId: string; userId: string; workspaceId: string },
) {
  const { data: session } = await supabase
    .from("retrieval_sessions")
    .select("id, user_query, status")
    .eq("id", input.retrievalSessionId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (!session || session.status !== "ready")
    throw new Error("retrieval_not_ready");
  const { data: existing } = await supabase
    .from("memory_dossiers")
    .select("id")
    .eq("retrieval_session_id", session.id)
    .in("status", ["draft", "review", "needs_conflict_review", "approved"])
    .maybeSingle();
  if (existing) return existing.id;
  const { data: hits, error: hitError } = await supabase
    .from("retrieval_hits")
    .select(
      "id, source_id, source_chunks(content), claims(statement), source_summaries(content), sources(title)",
    )
    .eq("retrieval_session_id", session.id)
    .eq("selected", true)
    .order("rank");
  if (hitError || !hits?.length) throw new Error("selected_evidence_missing");
  const evidence: AnalystEvidence[] = hits
    .map((hit) => ({
      content:
        hit.source_chunks?.content ??
        hit.claims?.statement ??
        hit.source_summaries?.content ??
        "",
      id: hit.id,
      sourceId: hit.source_id!,
      sourceTitle: hit.sources?.title ?? "Fonte sem título",
    }))
    .filter((item) => item.content && item.sourceId);
  const classified = await classifyEvidence(session.user_query, evidence);
  const dossier = validateDossierReferences(
    await synthesizeDossier(session.user_query, evidence, classified),
    new Set(evidence.map((item) => item.id)),
    new Set(evidence.map((item) => item.sourceId)),
  );
  const blocking = hasBlockingConflict(classified.conflicts);
  const { data: created, error: dossierError } = await supabase
    .from("memory_dossiers")
    .insert({
      analyst_model: getMemoryAiConfig().analysisModel,
      created_by: input.userId,
      dossier,
      evidence_coverage: Math.min(
        1,
        new Set(classified.classifications.map((item) => item.evidenceId))
          .size / evidence.length,
      ),
      executive_summary: dossier.executiveSummary,
      question: dossier.centralQuestion,
      retrieval_session_id: session.id,
      status: blocking ? "needs_conflict_review" : "review",
      title: `Dossiê: ${session.user_query.slice(0, 120)}`,
      workspace_id: input.workspaceId,
    })
    .select("id")
    .single();
  if (dossierError || !created) throw new Error("dossier_insert_failed");
  const classifications = new Map(
    classified.classifications.map((item) => [item.evidenceId, item]),
  );
  const { error: evidenceError } = await supabase
    .from("dossier_evidence")
    .insert(
      evidence.map((item) => {
        const classification = classifications.get(item.id);
        return {
          classification_rationale:
            classification?.rationale ?? "Sem classificação produzida.",
          confidence: classification?.confidence ?? 0,
          created_by: input.userId,
          evidence_type: classification?.evidenceType ?? "interpretation",
          excerpt: item.content.slice(0, 4_000),
          memory_dossier_id: created.id,
          relevance: classification?.relevance ?? 0,
          retrieval_hit_id: item.id,
          stance: classification?.stance ?? "unrelated",
          status:
            classification?.stance === "unrelated" ? "excluded" : "selected",
          workspace_id: input.workspaceId,
        };
      }),
    );
  if (evidenceError) throw new Error("dossier_evidence_insert_failed");
  if (classified.conflicts.length) {
    const { error: conflictError } = await supabase.from("conflicts").insert(
      classified.conflicts.map((conflict) => ({
        blocks_writing: conflict.blocksWriting,
        conflict_type: conflict.type,
        created_by: input.userId,
        description: conflict.description,
        left_retrieval_hit_id: conflict.leftEvidenceId,
        memory_dossier_id: created.id,
        right_retrieval_hit_id: conflict.rightEvidenceId,
        severity: conflict.severity,
        workspace_id: input.workspaceId,
      })),
    );
    if (conflictError) throw new Error("conflict_insert_failed");
  }
  return created.id;
}

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  GatewayEmbeddingProvider,
  isAiGatewayConfigured,
  vectorToPostgres,
} from "@/lib/memory/ai-config";
import {
  rankCandidates,
  type RetrievalCandidate,
} from "@/lib/retrieval/ranking";
import { planInvestigation } from "@/lib/retrieval/planner";
import type { Database } from "@/types/database";

export type RetrievalFilters = {
  author?: string;
  authority?: number;
  sourceType?: string;
};

export async function runMemoryRetrieval(
  supabase: SupabaseClient<Database>,
  input: {
    filters: RetrievalFilters;
    query: string;
    userId: string;
    workspaceId: string;
  },
) {
  const { data: session, error: sessionError } = await supabase
    .from("retrieval_sessions")
    .insert({
      created_by: input.userId,
      parameters: { filters: input.filters, max_per_source: 3, rrf_k: 60 },
      status: "processing",
      user_query: input.query,
      workspace_id: input.workspaceId,
    })
    .select("id")
    .single();
  if (sessionError || !session) throw new Error("retrieval_session_failed");

  try {
    let sourceQuery = supabase
      .from("sources")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("status", "ready");
    if (input.filters.author)
      sourceQuery = sourceQuery.ilike(
        "author_name",
        `%${input.filters.author}%`,
      );
    if (input.filters.sourceType)
      sourceQuery = sourceQuery.eq("source_type", input.filters.sourceType);
    if (input.filters.authority)
      sourceQuery = sourceQuery.gte("authority_level", input.filters.authority);
    const { data: sources, error: sourceError } = await sourceQuery;
    if (sourceError) throw sourceError;
    const sourceIds = (sources ?? []).map((source) => source.id);

    const { data: embeddingSpace } = await supabase
      .from("embedding_spaces")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("status", "active")
      .maybeSingle();
    const investigationPlan = await planInvestigation(input.query);
    const queries = investigationPlan.queries;
    const embeddings =
      embeddingSpace && isAiGatewayConfigured()
        ? await new GatewayEmbeddingProvider().embedTexts(queries)
        : queries.map(() => null);

    const candidates: RetrievalCandidate[] = [];
    let firstQueryId: string | null = null;
    for (const [ordinal, query] of queries.entries()) {
      const embedding = embeddings[ordinal];
      const { data: storedQuery, error: queryError } = await supabase
        .from("retrieval_queries")
        .insert({
          created_by: input.userId,
          embedding: embedding ? vectorToPostgres(embedding) : null,
          embedding_space_id: embedding ? embeddingSpace?.id : null,
          ordinal,
          parameters: {
            generated_by: ordinal === 0 ? "user" : "query_planner",
            temporal_hints: investigationPlan.temporalHints,
            topics: investigationPlan.topics,
          },
          query_text: query,
          query_type: ordinal === 0 ? "original" : "expansion",
          retrieval_session_id: session.id,
          workspace_id: input.workspaceId,
        })
        .select("id")
        .single();
      if (queryError || !storedQuery) throw new Error("retrieval_query_failed");
      firstQueryId ??= storedQuery.id;
      if (sourceIds.length === 0) continue;
      const { data, error } = await supabase.rpc("search_memory_hybrid", {
        p_embedding_space_id: embedding ? embeddingSpace?.id : undefined,
        p_match_count: 40,
        p_query_embedding: embedding ? vectorToPostgres(embedding) : undefined,
        p_query_text: query,
        p_rrf_k: 60,
        p_source_ids: sourceIds,
        p_workspace_id: input.workspaceId,
      });
      if (error) throw error;
      candidates.push(...((data ?? []) as RetrievalCandidate[]));
    }

    const ranked = rankCandidates(candidates);
    if (ranked.length > 0 && firstQueryId) {
      const { error: hitError } = await supabase.from("retrieval_hits").insert(
        ranked.map((hit, index) => ({
          authority_score: hit.authorityScore,
          claim_id: hit.entity_type === "claim" ? hit.entity_id : null,
          created_by: input.userId,
          diversity_penalty: hit.diversityPenalty,
          entity_type: hit.entity_type,
          final_score: hit.finalScore,
          lexical_score: hit.lexical_score,
          rank: index + 1,
          rationale: hit.selected
            ? "Selecionado após fusão híbrida, reranqueamento e limite por fonte."
            : "Preservado para auditoria; descartado pelo corte ou diversidade por fonte.",
          rerank_score: hit.finalScore,
          retrieval_level: hit.retrieval_level,
          retrieval_query_id: firstQueryId,
          retrieval_session_id: session.id,
          rrf_score: hit.rrf_score,
          selected: hit.selected,
          source_chunk_id:
            hit.entity_type === "source_chunk" ? hit.entity_id : null,
          source_id: hit.source_id,
          source_section_id: hit.source_section_id,
          source_summary_id:
            hit.entity_type === "source_summary" ? hit.entity_id : null,
          specificity_score: hit.specificityScore,
          status: hit.selected ? "selected" : "excluded",
          temporal_score: hit.temporalScore,
          vector_score: hit.vector_score,
          workspace_id: input.workspaceId,
        })),
      );
      if (hitError) throw hitError;
    }
    await supabase
      .from("retrieval_sessions")
      .update({ completed_at: new Date().toISOString(), status: "ready" })
      .eq("id", session.id);
    return session.id;
  } catch (error) {
    await supabase
      .from("retrieval_sessions")
      .update({ completed_at: new Date().toISOString(), status: "failed" })
      .eq("id", session.id);
    throw error;
  }
}

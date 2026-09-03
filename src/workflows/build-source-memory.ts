import { FatalError, RetryableError } from "workflow";

import {
  GatewayEmbeddingProvider,
  generateSectionAnalysis,
  generateSourceSummary,
  getMemoryAiConfig,
  vectorToPostgres,
} from "@/lib/memory/ai-config";
import { CHUNKER_VERSION, chunkSections } from "@/lib/memory/chunking";
import {
  MEMORY_PROMPTS,
  sectionAnalysisPrompt,
  sourceSummaryPrompt,
} from "@/lib/memory/prompts";
import {
  createWorkflowClient,
  normalizedConceptName,
  sha256Text,
  type MemoryWorkflowInput,
} from "@/lib/memory/workflow-client";
import type { Json } from "@/types/database";

const EMBEDDING_BATCH_SIZE = 32;
const ANALYSIS_CHUNKS_PER_BATCH = 8;

type AnalysisBatch = {
  batchIndex: number;
  chunkOrdinals: number[];
  heading: string | null;
  sectionId: string;
};

type PromptIds = Record<keyof typeof MEMORY_PROMPTS, string>;

type AiSetup = {
  embeddingSpaceId: string;
  promptIds: PromptIds;
};

function requireData<T>(value: T | null, errorCode: string): T {
  if (!value) throw new FatalError(errorCode);
  return value;
}

function safeDatabaseError(error: { message?: string } | null, code: string) {
  if (error) throw new Error(code);
}

function handleAiError(error: unknown): never {
  const statusCode =
    typeof error === "object" && error && "statusCode" in error
      ? Number(error.statusCode)
      : undefined;
  if (statusCode === 429) {
    throw new RetryableError("ai_rate_limited", { retryAfter: "1m" });
  }
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    throw new FatalError("ai_configuration_error");
  }
  throw error;
}

async function updateJob(
  input: MemoryWorkflowInput,
  values: {
    current_step?: string;
    error_message?: string | null;
    progress?: number;
    result?: Json;
    status?: string;
  },
) {
  const supabase = createWorkflowClient(input);
  const { error } = await supabase
    .from("processing_jobs")
    .update(values)
    .eq("id", input.jobId)
    .eq("workspace_id", input.workspaceId);
  safeDatabaseError(error, "job_update_failed");
}

async function buildChunksStep(input: MemoryWorkflowInput) {
  "use step";

  const supabase = createWorkflowClient(input);
  await updateJob(input, {
    current_step: "chunking",
    progress: 0.05,
    status: "processing",
  });

  const { data: version, error: versionError } = await supabase
    .from("source_versions")
    .select("id, source_id, extraction_status")
    .eq("id", input.versionId)
    .eq("source_id", input.sourceId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  safeDatabaseError(versionError, "version_load_failed");
  if (!version || version.extraction_status !== "ready") {
    throw new FatalError("source_not_ready_for_memory");
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("source_sections")
    .select("id, ordinal, heading, locator, content")
    .eq("source_version_id", input.versionId)
    .eq("workspace_id", input.workspaceId)
    .eq("status", "active")
    .order("ordinal");
  safeDatabaseError(sectionsError, "sections_load_failed");
  if (!sections || sections.length === 0) {
    throw new FatalError("source_has_no_sections");
  }

  const chunks = await chunkSections(sections);
  if (chunks.length === 0) throw new FatalError("source_has_no_text");

  const cleanupQueries = [
    supabase
      .from("source_summaries")
      .delete()
      .eq("source_version_id", input.versionId),
    supabase.from("claims").delete().eq("source_version_id", input.versionId),
    supabase.from("source_concepts").delete().eq("source_id", input.sourceId),
    supabase
      .from("source_chunks")
      .delete()
      .eq("source_version_id", input.versionId),
  ];
  for (const query of cleanupQueries) {
    const { error } = await query;
    safeDatabaseError(error, "memory_cleanup_failed");
  }

  for (let index = 0; index < chunks.length; index += 100) {
    const { error } = await supabase.from("source_chunks").insert(
      chunks.slice(index, index + 100).map((chunk) => ({
        chunker_version: CHUNKER_VERSION,
        content: chunk.content,
        content_hash: chunk.contentHash,
        created_by: input.userId,
        locator: chunk.locator,
        metadata: chunk.metadata,
        ordinal: chunk.ordinal,
        source_id: input.sourceId,
        source_section_id: chunk.sectionId,
        source_version_id: input.versionId,
        status: "active",
        token_count: chunk.tokenCount,
        workspace_id: input.workspaceId,
      })),
    );
    safeDatabaseError(error, "chunk_insert_failed");
  }

  const sectionById = new Map(
    sections.map((section) => [section.id, section] as const),
  );
  const grouped = new Map<string, number[]>();
  for (const chunk of chunks) {
    const ordinals = grouped.get(chunk.sectionId) ?? [];
    ordinals.push(chunk.ordinal);
    grouped.set(chunk.sectionId, ordinals);
  }
  const analysisBatches: AnalysisBatch[] = [];
  for (const [sectionId, ordinals] of grouped) {
    for (
      let index = 0;
      index < ordinals.length;
      index += ANALYSIS_CHUNKS_PER_BATCH
    ) {
      analysisBatches.push({
        batchIndex: Math.floor(index / ANALYSIS_CHUNKS_PER_BATCH),
        chunkOrdinals: ordinals.slice(index, index + ANALYSIS_CHUNKS_PER_BATCH),
        heading: sectionById.get(sectionId)?.heading ?? null,
        sectionId,
      });
    }
  }

  await updateJob(input, {
    current_step: "chunks_ready",
    progress: 0.25,
    result: {
      chunk_count: chunks.length,
      section_count: sections.length,
    },
  });
  return {
    analysisBatches,
    chunkCount: chunks.length,
    sectionIds: sections.map((section) => section.id),
  };
}

async function markWaitingForAiStep(
  input: MemoryWorkflowInput,
  chunkCount: number,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const message =
    "Os chunks foram criados, mas o provedor de IA ainda não está configurado.";
  const { error: versionError } = await supabase
    .from("source_versions")
    .update({ memory_error: message, memory_status: "waiting_for_ai" })
    .eq("id", input.versionId);
  safeDatabaseError(versionError, "version_update_failed");
  await updateJob(input, {
    current_step: "waiting_for_ai",
    error_message: message,
    progress: 0.25,
    result: { chunk_count: chunkCount },
    status: "retry",
  });
}

async function ensureAiSetupStep(input: MemoryWorkflowInput): Promise<AiSetup> {
  "use step";

  const supabase = createWorkflowClient(input);
  const config = getMemoryAiConfig();
  await updateJob(input, { current_step: "ai_setup", progress: 0.3 });

  const { data: activeSpace, error: activeError } = await supabase
    .from("embedding_spaces")
    .select("id, provider, model, dimensions, version")
    .eq("workspace_id", input.workspaceId)
    .eq("status", "active")
    .maybeSingle();
  safeDatabaseError(activeError, "embedding_space_load_failed");

  let embeddingSpaceId = activeSpace?.id;
  const matches =
    activeSpace &&
    activeSpace.provider === config.embeddingSpace.provider &&
    activeSpace.model === config.embeddingSpace.model &&
    activeSpace.dimensions === config.embeddingSpace.dimensions &&
    activeSpace.version === config.embeddingSpace.version;

  if (activeSpace && !matches) {
    const { error } = await supabase
      .from("embedding_spaces")
      .update({ status: "superseded" })
      .eq("id", activeSpace.id);
    safeDatabaseError(error, "embedding_space_supersede_failed");
    embeddingSpaceId = undefined;
  }

  if (!embeddingSpaceId) {
    const { data, error } = await supabase
      .from("embedding_spaces")
      .insert({
        created_by: input.userId,
        ...config.embeddingSpace,
        status: "active",
        workspace_id: input.workspaceId,
      })
      .select("id")
      .single();
    safeDatabaseError(error, "embedding_space_insert_failed");
    embeddingSpaceId = requireData(data, "embedding_space_insert_failed").id;
  }

  const promptIds = {} as PromptIds;
  for (const [promptKey, prompt] of Object.entries(MEMORY_PROMPTS) as Array<
    [
      keyof typeof MEMORY_PROMPTS,
      (typeof MEMORY_PROMPTS)[keyof typeof MEMORY_PROMPTS],
    ]
  >) {
    const checksum = await sha256Text(prompt.content);
    const { data: existing, error: loadError } = await supabase
      .from("prompt_versions")
      .select("id, checksum")
      .eq("workspace_id", input.workspaceId)
      .eq("prompt_key", promptKey)
      .eq("version", prompt.version)
      .maybeSingle();
    safeDatabaseError(loadError, "prompt_load_failed");
    if (existing && existing.checksum !== checksum) {
      throw new FatalError("prompt_version_conflict");
    }
    if (existing) {
      promptIds[promptKey] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("prompt_versions")
      .insert({
        checksum,
        content: prompt.content,
        created_by: input.userId,
        input_schema: { type: "document_chunks" },
        output_schema: { type: promptKey },
        prompt_key: promptKey,
        role: prompt.role,
        status: "active",
        version: prompt.version,
        workspace_id: input.workspaceId,
      })
      .select("id")
      .single();
    safeDatabaseError(error, "prompt_insert_failed");
    promptIds[promptKey] = requireData(data, "prompt_insert_failed").id;
  }

  return { embeddingSpaceId, promptIds };
}

async function embedChunkBatchStep(
  input: MemoryWorkflowInput,
  embeddingSpaceId: string,
  offset: number,
  totalChunks: number,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const { data: chunks, error } = await supabase
    .from("source_chunks")
    .select("id, content, embedding, embedding_space_id")
    .eq("source_version_id", input.versionId)
    .eq("status", "active")
    .order("ordinal")
    .range(offset, offset + EMBEDDING_BATCH_SIZE - 1);
  safeDatabaseError(error, "chunks_load_failed");
  const pending = (chunks ?? []).filter(
    (chunk) =>
      !chunk.embedding || chunk.embedding_space_id !== embeddingSpaceId,
  );

  if (pending.length > 0) {
    try {
      const embeddings = await new GatewayEmbeddingProvider().embedTexts(
        pending.map((chunk) => chunk.content),
      );
      for (const [index, chunk] of pending.entries()) {
        const { error: updateError } = await supabase
          .from("source_chunks")
          .update({
            embedding: vectorToPostgres(embeddings[index] ?? []),
            embedding_space_id: embeddingSpaceId,
          })
          .eq("id", chunk.id);
        safeDatabaseError(updateError, "chunk_embedding_update_failed");
      }
    } catch (aiError) {
      handleAiError(aiError);
    }
  }

  await updateJob(input, {
    current_step: "embedding_chunks",
    progress: Math.min(
      0.45,
      0.3 + ((offset + (chunks?.length ?? 0)) / totalChunks) * 0.15,
    ),
  });
}

async function analyzeBatchStep(
  input: MemoryWorkflowInput,
  setup: AiSetup,
  batch: AnalysisBatch,
  batchNumber: number,
  batchTotal: number,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const { data: chunks, error } = await supabase
    .from("source_chunks")
    .select("id, ordinal, content, locator")
    .eq("source_version_id", input.versionId)
    .in("ordinal", batch.chunkOrdinals)
    .order("ordinal");
  safeDatabaseError(error, "analysis_chunks_load_failed");
  if (!chunks || chunks.length === 0) {
    throw new FatalError("analysis_batch_empty");
  }

  let analysis: Awaited<ReturnType<typeof generateSectionAnalysis>>;
  try {
    analysis = await generateSectionAnalysis(
      sectionAnalysisPrompt({ chunks, heading: batch.heading }),
    );
  } catch (aiError) {
    handleAiError(aiError);
  }

  const config = getMemoryAiConfig();
  const batchKey = `${input.revision}:${batch.sectionId}:${batch.batchIndex}`;
  const summaryHash = await sha256Text(analysis.summary);
  const { error: previousSummaryError } = await supabase
    .from("source_summaries")
    .delete()
    .eq("source_version_id", input.versionId)
    .eq("source_section_id", batch.sectionId)
    .contains("metadata", { batch_key: batchKey })
    .eq("status", "draft");
  safeDatabaseError(previousSummaryError, "partial_summary_cleanup_failed");
  const { error: summaryError } = await supabase
    .from("source_summaries")
    .insert({
      content: analysis.summary,
      content_hash: summaryHash,
      created_by: input.userId,
      metadata: {
        batch_index: batch.batchIndex,
        batch_key: batchKey,
        chunk_ordinals: batch.chunkOrdinals,
        memory_revision: input.revision,
      },
      model: config.analysisModel,
      model_provider: "vercel-ai-gateway",
      prompt_version_id: setup.promptIds.section_summarizer,
      source_id: input.sourceId,
      source_section_id: batch.sectionId,
      source_version_id: input.versionId,
      status: "draft",
      summary_kind: "section",
      workspace_id: input.workspaceId,
    });
  safeDatabaseError(summaryError, "partial_summary_insert_failed");

  const chunkByOrdinal = new Map(
    chunks.map((chunk) => [chunk.ordinal, chunk] as const),
  );

  for (const concept of analysis.concepts) {
    const evidenceChunk = chunkByOrdinal.get(concept.evidenceChunkOrdinal);
    if (!evidenceChunk) continue;
    const normalizedName = normalizedConceptName(concept.name);
    if (!normalizedName) continue;

    const { data: existing, error: conceptLoadError } = await supabase
      .from("concepts")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("normalized_name", normalizedName)
      .maybeSingle();
    safeDatabaseError(conceptLoadError, "concept_load_failed");
    let conceptId = existing?.id;
    if (!conceptId) {
      const { data, error: conceptInsertError } = await supabase
        .from("concepts")
        .insert({
          created_by: input.userId,
          description: concept.description,
          name: concept.name,
          normalized_name: normalizedName,
          status: "candidate",
          workspace_id: input.workspaceId,
        })
        .select("id")
        .single();
      safeDatabaseError(conceptInsertError, "concept_insert_failed");
      conceptId = requireData(data, "concept_insert_failed").id;
    }

    const evidence = [
      {
        chunk_id: evidenceChunk.id,
        chunk_ordinal: evidenceChunk.ordinal,
        section_id: batch.sectionId,
      },
    ];
    const { data: sourceConcept, error: linkLoadError } = await supabase
      .from("source_concepts")
      .select("id")
      .eq("source_id", input.sourceId)
      .eq("concept_id", conceptId)
      .maybeSingle();
    safeDatabaseError(linkLoadError, "source_concept_load_failed");
    const relationQuery = sourceConcept
      ? supabase
          .from("source_concepts")
          .update({
            evidence,
            relevance: concept.relevance,
            status: "candidate",
          })
          .eq("id", sourceConcept.id)
      : supabase.from("source_concepts").insert({
          concept_id: conceptId,
          created_by: input.userId,
          evidence,
          relevance: concept.relevance,
          source_id: input.sourceId,
          status: "candidate",
          workspace_id: input.workspaceId,
        });
    const { error: relationError } = await relationQuery;
    safeDatabaseError(relationError, "source_concept_write_failed");
  }

  for (const claim of analysis.claims) {
    const evidenceChunk = chunkByOrdinal.get(claim.evidenceChunkOrdinal);
    const excerpt = claim.evidenceQuote.trim();
    if (!evidenceChunk || !evidenceChunk.content.includes(excerpt)) continue;
    const statement = claim.statement.trim();
    const claimHash = await sha256Text(statement);
    const { data: existing, error: claimLoadError } = await supabase
      .from("claims")
      .select("id")
      .eq("source_version_id", input.versionId)
      .eq("claim_hash", claimHash)
      .eq("version", input.revision)
      .maybeSingle();
    safeDatabaseError(claimLoadError, "claim_load_failed");
    let claimId = existing?.id;
    if (!claimId) {
      const { data, error: claimInsertError } = await supabase
        .from("claims")
        .insert({
          claim_hash: claimHash,
          claim_type: claim.claimType,
          confidence: claim.confidence,
          created_by: input.userId,
          metadata: {
            analysis_batch: batchKey,
            memory_revision: input.revision,
          },
          prompt_version_id: setup.promptIds.claim_extractor,
          source_id: input.sourceId,
          source_section_id: batch.sectionId,
          source_version_id: input.versionId,
          statement,
          status: "candidate",
          version: input.revision,
          workspace_id: input.workspaceId,
        })
        .select("id")
        .single();
      safeDatabaseError(claimInsertError, "claim_insert_failed");
      claimId = requireData(data, "claim_insert_failed").id;
    }

    const { data: existingEvidence, error: evidenceLoadError } = await supabase
      .from("claim_evidence")
      .select("id")
      .eq("claim_id", claimId)
      .eq("source_chunk_id", evidenceChunk.id)
      .eq("evidence_type", "direct")
      .maybeSingle();
    safeDatabaseError(evidenceLoadError, "claim_evidence_load_failed");
    if (!existingEvidence) {
      const { error: evidenceError } = await supabase
        .from("claim_evidence")
        .insert({
          claim_id: claimId,
          created_by: input.userId,
          evidence_type: "direct",
          excerpt,
          locator: evidenceChunk.locator,
          source_chunk_id: evidenceChunk.id,
          status: "candidate",
          strength: claim.confidence,
          workspace_id: input.workspaceId,
        });
      safeDatabaseError(evidenceError, "claim_evidence_insert_failed");
    }
  }

  await updateJob(input, {
    current_step: "analyzing_sections",
    progress: Math.min(0.78, 0.45 + ((batchNumber + 1) / batchTotal) * 0.33),
  });
}

async function consolidateSectionStep(
  input: MemoryWorkflowInput,
  setup: AiSetup,
  sectionId: string,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const { data: active } = await supabase
    .from("source_summaries")
    .select("id")
    .eq("source_version_id", input.versionId)
    .eq("source_section_id", sectionId)
    .eq("summary_kind", "section")
    .eq("status", "active")
    .maybeSingle();
  if (active) return;

  const { data: drafts, error } = await supabase
    .from("source_summaries")
    .select("id, content, metadata")
    .eq("source_version_id", input.versionId)
    .eq("source_section_id", sectionId)
    .eq("summary_kind", "section")
    .eq("status", "draft")
    .order("created_at");
  safeDatabaseError(error, "partial_summaries_load_failed");
  if (!drafts || drafts.length === 0) {
    throw new FatalError("partial_summaries_missing");
  }

  if (drafts.length === 1) {
    const { error: updateError } = await supabase
      .from("source_summaries")
      .update({ status: "active" })
      .eq("id", drafts[0].id);
    safeDatabaseError(updateError, "section_summary_activate_failed");
    return;
  }

  let output: Awaited<ReturnType<typeof generateSourceSummary>>;
  try {
    output = await generateSourceSummary(
      sourceSummaryPrompt(
        drafts.map((draft, index) => ({
          heading: `Parte ${index + 1}`,
          summary: draft.content,
        })),
      ),
    );
  } catch (aiError) {
    handleAiError(aiError);
  }
  const config = getMemoryAiConfig();
  const { error: insertError } = await supabase
    .from("source_summaries")
    .insert({
      content: output.summary,
      content_hash: await sha256Text(output.summary),
      created_by: input.userId,
      metadata: {
        memory_revision: input.revision,
        partial_summary_count: drafts.length,
      },
      model: config.analysisModel,
      model_provider: "vercel-ai-gateway",
      prompt_version_id: setup.promptIds.section_summarizer,
      source_id: input.sourceId,
      source_section_id: sectionId,
      source_version_id: input.versionId,
      status: "active",
      summary_kind: "section",
      workspace_id: input.workspaceId,
    });
  safeDatabaseError(insertError, "section_summary_insert_failed");
}

async function createGlobalSummariesStep(
  input: MemoryWorkflowInput,
  setup: AiSetup,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const { data: summaries, error } = await supabase
    .from("source_summaries")
    .select("content, source_sections(heading, ordinal)")
    .eq("source_version_id", input.versionId)
    .eq("summary_kind", "section")
    .eq("status", "active");
  safeDatabaseError(error, "section_summaries_load_failed");
  if (!summaries || summaries.length === 0) {
    throw new FatalError("section_summaries_missing");
  }

  const ordered = [...summaries].sort(
    (a, b) =>
      (a.source_sections?.ordinal ?? 0) - (b.source_sections?.ordinal ?? 0),
  );
  let output: Awaited<ReturnType<typeof generateSourceSummary>>;
  try {
    output = await generateSourceSummary(
      sourceSummaryPrompt(
        ordered.map((summary) => ({
          heading: summary.source_sections?.heading ?? null,
          summary: summary.content,
        })),
      ),
    );
  } catch (aiError) {
    handleAiError(aiError);
  }

  const config = getMemoryAiConfig();
  const contentHash = await sha256Text(output.summary);
  const common = {
    content: output.summary,
    content_hash: contentHash,
    created_by: input.userId,
    metadata: {
      memory_revision: input.revision,
      section_summary_count: ordered.length,
    },
    model: config.analysisModel,
    model_provider: "vercel-ai-gateway",
    prompt_version_id: setup.promptIds.source_summarizer,
    source_id: input.sourceId,
    source_version_id: input.versionId,
    status: "active",
    workspace_id: input.workspaceId,
  };
  const { error: insertError } = await supabase
    .from("source_summaries")
    .insert([
      { ...common, summary_kind: "version" },
      { ...common, summary_kind: "source" },
    ]);
  safeDatabaseError(insertError, "global_summary_insert_failed");
  await updateJob(input, { current_step: "global_summary", progress: 0.84 });
}

async function getDerivedCountsStep(input: MemoryWorkflowInput) {
  "use step";

  const supabase = createWorkflowClient(input);
  const [{ count: claimCount, error: claimError }, sourceConceptResult] =
    await Promise.all([
      supabase
        .from("claims")
        .select("id", { count: "exact", head: true })
        .eq("source_version_id", input.versionId),
      supabase
        .from("source_concepts")
        .select("concept_id", { count: "exact" })
        .eq("source_id", input.sourceId),
    ]);
  safeDatabaseError(claimError, "claim_count_failed");
  safeDatabaseError(sourceConceptResult.error, "concept_count_failed");
  return {
    claimCount: claimCount ?? 0,
    conceptCount: sourceConceptResult.count ?? 0,
  };
}

async function embedDerivedBatchStep(
  input: MemoryWorkflowInput,
  embeddingSpaceId: string,
  entity: "claim" | "concept",
  offset: number,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const provider = new GatewayEmbeddingProvider();

  if (entity === "claim") {
    const { data, error } = await supabase
      .from("claims")
      .select("id, statement, embedding, embedding_space_id")
      .eq("source_version_id", input.versionId)
      .order("created_at")
      .range(offset, offset + EMBEDDING_BATCH_SIZE - 1);
    safeDatabaseError(error, "claims_load_failed");
    const pending = (data ?? []).filter(
      (claim) =>
        !claim.embedding || claim.embedding_space_id !== embeddingSpaceId,
    );
    if (pending.length === 0) return;
    try {
      const embeddings = await provider.embedTexts(
        pending.map((claim) => claim.statement),
      );
      for (const [index, claim] of pending.entries()) {
        const { error: updateError } = await supabase
          .from("claims")
          .update({
            embedding: vectorToPostgres(embeddings[index] ?? []),
            embedding_space_id: embeddingSpaceId,
          })
          .eq("id", claim.id);
        safeDatabaseError(updateError, "claim_embedding_update_failed");
      }
    } catch (aiError) {
      handleAiError(aiError);
    }
    return;
  }

  const { data: links, error: linksError } = await supabase
    .from("source_concepts")
    .select("concept_id")
    .eq("source_id", input.sourceId)
    .order("created_at")
    .range(offset, offset + EMBEDDING_BATCH_SIZE - 1);
  safeDatabaseError(linksError, "concept_links_load_failed");
  const conceptIds = (links ?? []).map((link) => link.concept_id);
  if (conceptIds.length === 0) return;
  const { data: concepts, error: conceptsError } = await supabase
    .from("concepts")
    .select("id, name, description, embedding, embedding_space_id")
    .in("id", conceptIds);
  safeDatabaseError(conceptsError, "concepts_load_failed");
  const pending = (concepts ?? []).filter(
    (concept) =>
      !concept.embedding || concept.embedding_space_id !== embeddingSpaceId,
  );
  if (pending.length === 0) return;
  try {
    const embeddings = await provider.embedTexts(
      pending.map((concept) =>
        [concept.name, concept.description].filter(Boolean).join("\n"),
      ),
    );
    for (const [index, concept] of pending.entries()) {
      const { error: updateError } = await supabase
        .from("concepts")
        .update({
          embedding: vectorToPostgres(embeddings[index] ?? []),
          embedding_space_id: embeddingSpaceId,
        })
        .eq("id", concept.id);
      safeDatabaseError(updateError, "concept_embedding_update_failed");
    }
  } catch (aiError) {
    handleAiError(aiError);
  }
}

async function finalizeMemoryStep(
  input: MemoryWorkflowInput,
  chunkCount: number,
  sectionCount: number,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const [summaryResult, claimResult, conceptResult] = await Promise.all([
    supabase
      .from("source_summaries")
      .select("id", { count: "exact", head: true })
      .eq("source_version_id", input.versionId)
      .eq("status", "active"),
    supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("source_version_id", input.versionId),
    supabase
      .from("source_concepts")
      .select("id", { count: "exact", head: true })
      .eq("source_id", input.sourceId),
  ]);
  safeDatabaseError(summaryResult.error, "summary_count_failed");
  safeDatabaseError(claimResult.error, "claim_count_failed");
  safeDatabaseError(conceptResult.error, "concept_count_failed");

  const completedAt = new Date().toISOString();
  const { error: versionError } = await supabase
    .from("source_versions")
    .update({
      memory_built_at: completedAt,
      memory_error: null,
      memory_status: "ready",
    })
    .eq("id", input.versionId);
  safeDatabaseError(versionError, "version_finalize_failed");
  const { error: sourceError } = await supabase
    .from("sources")
    .update({ status: "ready" })
    .eq("id", input.sourceId);
  safeDatabaseError(sourceError, "source_finalize_failed");
  const result = {
    chunk_count: chunkCount,
    claim_count: claimResult.count ?? 0,
    concept_count: conceptResult.count ?? 0,
    memory_revision: input.revision,
    section_count: sectionCount,
    summary_count: summaryResult.count ?? 0,
  };
  const { error: jobError } = await supabase
    .from("processing_jobs")
    .update({
      completed_at: completedAt,
      current_step: "complete",
      error_message: null,
      progress: 1,
      result,
      status: "complete",
    })
    .eq("id", input.jobId);
  safeDatabaseError(jobError, "job_finalize_failed");
  await supabase.from("audit_logs").insert({
    action: "memory.build.completed",
    actor_user_id: input.userId,
    created_by: input.userId,
    entity_id: input.versionId,
    entity_type: "source_version",
    metadata: result,
    request_id: input.jobId,
    workspace_id: input.workspaceId,
  });
  return result;
}

async function markMemoryFailedStep(
  input: MemoryWorkflowInput,
  internalReason: string,
) {
  "use step";

  const supabase = createWorkflowClient(input);
  const message = internalReason.includes("ai_configuration")
    ? "A configuração do provedor de IA precisa ser revisada."
    : "A construção da memória não foi concluída. É seguro tentar novamente.";
  await Promise.all([
    supabase
      .from("source_versions")
      .update({ memory_error: message, memory_status: "failed" })
      .eq("id", input.versionId),
    supabase
      .from("sources")
      .update({ status: "failed" })
      .eq("id", input.sourceId),
    supabase
      .from("processing_jobs")
      .update({
        completed_at: new Date().toISOString(),
        current_step: "failed",
        error_message: message,
        status: "failed",
      })
      .eq("id", input.jobId),
  ]);
}

export async function buildSourceMemoryWorkflow(input: MemoryWorkflowInput) {
  "use workflow";

  try {
    const indexed = await buildChunksStep(input);
    if (!input.aiEnabled) {
      await markWaitingForAiStep(input, indexed.chunkCount);
      return { chunkCount: indexed.chunkCount, status: "waiting_for_ai" };
    }

    const setup = await ensureAiSetupStep(input);
    for (
      let offset = 0;
      offset < indexed.chunkCount;
      offset += EMBEDDING_BATCH_SIZE
    ) {
      await embedChunkBatchStep(
        input,
        setup.embeddingSpaceId,
        offset,
        indexed.chunkCount,
      );
    }

    for (const [index, batch] of indexed.analysisBatches.entries()) {
      await analyzeBatchStep(
        input,
        setup,
        batch,
        index,
        indexed.analysisBatches.length,
      );
    }
    for (const sectionId of indexed.sectionIds) {
      await consolidateSectionStep(input, setup, sectionId);
    }
    await createGlobalSummariesStep(input, setup);

    const derived = await getDerivedCountsStep(input);
    for (
      let offset = 0;
      offset < derived.claimCount;
      offset += EMBEDDING_BATCH_SIZE
    ) {
      await embedDerivedBatchStep(
        input,
        setup.embeddingSpaceId,
        "claim",
        offset,
      );
    }
    for (
      let offset = 0;
      offset < derived.conceptCount;
      offset += EMBEDDING_BATCH_SIZE
    ) {
      await embedDerivedBatchStep(
        input,
        setup.embeddingSpaceId,
        "concept",
        offset,
      );
    }

    return await finalizeMemoryStep(
      input,
      indexed.chunkCount,
      indexed.sectionIds.length,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    await markMemoryFailedStep(input, reason);
    throw error;
  }
}

import { embedMany, generateText, Output } from "ai";
import { z } from "zod";

export const DEFAULT_ANALYSIS_MODEL = "openai/gpt-5.6-luna";
export const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_SPACE_VERSION = 1;

export type EmbeddingSpaceIdentity = {
  dimensions: number;
  model: string;
  provider: string;
  version: number;
};

export interface EmbeddingProvider {
  readonly identity: EmbeddingSpaceIdentity;
  embedTexts(values: string[]): Promise<number[][]>;
}

export function isAiGatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  );
}

export function getMemoryAiConfig() {
  const analysisModel =
    process.env.ANALYSIS_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;
  const embeddingModel =
    process.env.EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
  const dimensions = Number(
    process.env.EMBEDDING_DIMENSIONS || EMBEDDING_DIMENSIONS,
  );

  if (!Number.isInteger(dimensions) || dimensions !== EMBEDDING_DIMENSIONS) {
    throw new Error("incompatible_embedding_dimensions");
  }

  return {
    analysisModel,
    embeddingModel,
    embeddingSpace: {
      dimensions,
      model: embeddingModel,
      provider: embeddingModel.split("/")[0] || "gateway",
      version: EMBEDDING_SPACE_VERSION,
    } satisfies EmbeddingSpaceIdentity,
  };
}

export class GatewayEmbeddingProvider implements EmbeddingProvider {
  readonly identity: EmbeddingSpaceIdentity;

  constructor(identity = getMemoryAiConfig().embeddingSpace) {
    this.identity = identity;
  }

  async embedTexts(values: string[]) {
    if (values.length === 0) return [];
    const { embeddings } = await embedMany({
      maxParallelCalls: 1,
      maxRetries: 2,
      model: this.identity.model,
      values,
    });

    if (
      embeddings.length !== values.length ||
      embeddings.some(
        (embedding) => embedding.length !== this.identity.dimensions,
      )
    ) {
      throw new Error("incompatible_embedding_result");
    }
    return embeddings;
  }
}

export const sectionAnalysisSchema = z.object({
  claims: z
    .array(
      z.object({
        claimType: z.enum([
          "factual",
          "interpretive",
          "normative",
          "autobiographical",
          "hypothesis",
        ]),
        confidence: z.number().min(0).max(1),
        evidenceChunkOrdinal: z.number().int().nonnegative(),
        evidenceQuote: z.string().min(8).max(700),
        statement: z.string().min(8).max(1_500),
      }),
    )
    .max(30),
  concepts: z
    .array(
      z.object({
        description: z.string().min(8).max(1_000),
        evidenceChunkOrdinal: z.number().int().nonnegative(),
        name: z.string().min(2).max(240),
        relevance: z.number().min(0).max(1),
      }),
    )
    .max(20),
  summary: z.string().min(20).max(4_000),
});

export const sourceSummarySchema = z.object({
  summary: z.string().min(30).max(8_000),
});

export async function generateSectionAnalysis(prompt: string) {
  const { analysisModel } = getMemoryAiConfig();
  const { output } = await generateText({
    maxRetries: 2,
    model: analysisModel,
    output: Output.object({ schema: sectionAnalysisSchema }),
    prompt,
  });
  return output;
}

export async function generateSourceSummary(prompt: string) {
  const { analysisModel } = getMemoryAiConfig();
  const { output } = await generateText({
    maxRetries: 2,
    model: analysisModel,
    output: Output.object({ schema: sourceSummarySchema }),
    prompt,
  });
  return output;
}

export function vectorToPostgres(embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("incompatible_embedding_result");
  }
  return `[${embedding.join(",")}]`;
}

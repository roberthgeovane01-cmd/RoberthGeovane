import type { Json } from "@/types/database";

export const CHUNKER_VERSION = 1;
export const TOKEN_COUNT_METHOD = "pt-word-estimate-v1";

export type ChunkableSection = {
  content: string;
  heading: string | null;
  id: string;
  locator: Json;
  ordinal: number;
};

export type PreparedChunk = {
  content: string;
  contentHash: string;
  locator: Json;
  metadata: Json;
  ordinal: number;
  sectionId: string;
  tokenCount: number;
};

type ChunkingOptions = {
  maxTokens?: number;
  targetTokens?: number;
};

function canonicalText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function estimateTokenCount(value: string) {
  const words = value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  const punctuation = value.match(/[^\p{L}\p{N}\s]/gu);
  return Math.max(
    1,
    Math.ceil((words?.length ?? 0) * 1.3 + (punctuation?.length ?? 0) * 0.25),
  );
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function splitLongParagraph(paragraph: string, maxTokens: number) {
  if (estimateTokenCount(paragraph) <= maxTokens) return [paragraph];

  const sentences = Array.from(
    new Intl.Segmenter("pt-BR", { granularity: "sentence" }).segment(paragraph),
    ({ segment }) => segment.trim(),
  ).filter(Boolean);
  const pieces: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (estimateTokenCount(sentence) > maxTokens) {
      if (current) pieces.push(current);
      current = "";
      const words = sentence.split(/\s+/);
      let wordBuffer: string[] = [];
      for (const word of words) {
        const candidate = [...wordBuffer, word].join(" ");
        if (
          wordBuffer.length > 0 &&
          estimateTokenCount(candidate) > maxTokens
        ) {
          pieces.push(wordBuffer.join(" "));
          wordBuffer = [word];
        } else {
          wordBuffer.push(word);
        }
      }
      if (wordBuffer.length > 0) pieces.push(wordBuffer.join(" "));
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && estimateTokenCount(candidate) > maxTokens) {
      pieces.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) pieces.push(current);
  return pieces;
}

function sectionLocator(locator: Json, chunkInSection: number): Json {
  const base =
    locator && typeof locator === "object" && !Array.isArray(locator)
      ? locator
      : {};
  return { ...base, chunk_in_section: chunkInSection + 1 };
}

export async function chunkSections(
  sections: ChunkableSection[],
  options: ChunkingOptions = {},
) {
  const targetTokens = options.targetTokens ?? 650;
  const maxTokens = options.maxTokens ?? 850;
  if (targetTokens < 50 || maxTokens < targetTokens) {
    throw new Error("invalid_chunking_options");
  }

  const chunks: PreparedChunk[] = [];

  for (const section of [...sections].sort((a, b) => a.ordinal - b.ordinal)) {
    const content = canonicalText(section.content);
    if (!content) continue;

    const paragraphs = content
      .split(/\n{2,}/)
      .map(canonicalText)
      .filter(Boolean)
      .flatMap((paragraph) => splitLongParagraph(paragraph, maxTokens));
    let buffer: string[] = [];
    let chunkInSection = 0;

    async function flush() {
      if (buffer.length === 0) return;
      const chunkContent = canonicalText(buffer.join("\n\n"));
      chunks.push({
        content: chunkContent,
        contentHash: await sha256(chunkContent),
        locator: sectionLocator(section.locator, chunkInSection),
        metadata: {
          chunker_version: CHUNKER_VERSION,
          heading: section.heading,
          section_ordinal: section.ordinal,
          token_count_method: TOKEN_COUNT_METHOD,
        },
        ordinal: chunks.length,
        sectionId: section.id,
        tokenCount: estimateTokenCount(chunkContent),
      });
      buffer = [];
      chunkInSection += 1;
    }

    for (const paragraph of paragraphs) {
      const candidate = [...buffer, paragraph].join("\n\n");
      if (buffer.length > 0 && estimateTokenCount(candidate) > targetTokens) {
        await flush();
      }
      buffer.push(paragraph);
      if (estimateTokenCount(buffer.join("\n\n")) >= maxTokens) {
        await flush();
      }
    }
    await flush();
  }

  return chunks;
}

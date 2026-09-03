import { describe, expect, it } from "vitest";

import { chunkSections, estimateTokenCount } from "./chunking";

const sections = [
  {
    content: "Primeiro parágrafo.\n\nSegundo parágrafo.",
    heading: "Abertura",
    id: "section-a",
    locator: { line_start: 1, page_start: 2 },
    ordinal: 0,
  },
  {
    content: "Outra seção, com sentido próprio.",
    heading: "Continuação",
    id: "section-b",
    locator: { line_start: 8, page_start: 3 },
    ordinal: 1,
  },
];

describe("semantic document chunking", () => {
  it("preserves section and paragraph boundaries", async () => {
    const chunks = await chunkSections(sections, {
      maxTokens: 100,
      targetTokens: 50,
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      content: "Primeiro parágrafo.\n\nSegundo parágrafo.",
      ordinal: 0,
      sectionId: "section-a",
    });
    expect(chunks[1]).toMatchObject({ ordinal: 1, sectionId: "section-b" });
  });

  it("produces stable SHA-256 hashes and locators", async () => {
    const first = await chunkSections(sections);
    const second = await chunkSections(sections);

    expect(first[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first[0]?.contentHash).toBe(second[0]?.contentHash);
    expect(first[0]?.locator).toMatchObject({
      chunk_in_section: 1,
      page_start: 2,
    });
  });

  it("splits exceptional long paragraphs without exceeding the limit", async () => {
    const content = Array.from(
      { length: 120 },
      (_, index) => `Frase número ${index + 1} preserva uma ideia completa.`,
    ).join(" ");
    const chunks = await chunkSections([{ ...sections[0], content }], {
      maxTokens: 100,
      targetTokens: 80,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.tokenCount <= 100)).toBe(true);
    expect(
      estimateTokenCount(chunks.map((chunk) => chunk.content).join(" ")),
    ).toBeGreaterThan(0);
  });
});

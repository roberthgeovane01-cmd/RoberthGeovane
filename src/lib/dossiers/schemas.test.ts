import { describe, expect, it } from "vitest";
import {
  hasBlockingConflict,
  validateDossierReferences,
  type MemoryDossier,
} from "./schemas";

const evidenceId = "11111111-1111-4111-8111-111111111111";
const sourceId = "22222222-2222-4222-8222-222222222222";
const dossier: MemoryDossier = {
  centralQuestion: "Como a memória sustenta a identidade?",
  centralSources: [sourceId],
  complements: [],
  contradictions: [],
  convergences: [
    {
      evidenceIds: [evidenceId],
      sourceIds: [sourceId],
      text: "A evidência relaciona memória e identidade.",
    },
  ],
  editorialNotes: [],
  executiveSummary:
    "Síntese analítica sustentada pelas evidências selecionadas.",
  knowledgeGaps: [],
  relatedEpisodes: [],
  temporalEvolution: [],
  tensions: [],
};

describe("dossier safety contract", () => {
  it("rejects references that were not retrieved", () => {
    expect(
      validateDossierReferences(
        dossier,
        new Set([evidenceId]),
        new Set([sourceId]),
      ),
    ).toBe(dossier);
    expect(() =>
      validateDossierReferences(
        {
          ...dossier,
          centralSources: ["33333333-3333-4333-8333-333333333333"],
        },
        new Set([evidenceId]),
        new Set([sourceId]),
      ),
    ).toThrow("dossier_contains_unknown_references");
  });
  it("blocks writing only for explicit severe conflicts", () => {
    expect(
      hasBlockingConflict([{ blocksWriting: true, severity: "high" }]),
    ).toBe(true);
    expect(
      hasBlockingConflict([{ blocksWriting: true, severity: "medium" }]),
    ).toBe(false);
  });
});

import { z } from "zod";

const referencedConclusion = z.object({
  evidenceIds: z.array(z.uuid()).min(1),
  sourceIds: z.array(z.uuid()).min(1),
  text: z.string().min(8).max(2_000),
});

export const memoryDossierSchema = z.object({
  centralQuestion: z.string().min(3).max(1_000),
  centralSources: z.array(z.uuid()),
  complements: z.array(referencedConclusion).max(20),
  contradictions: z.array(referencedConclusion).max(20),
  convergences: z.array(referencedConclusion).max(20),
  editorialNotes: z.array(z.string().max(1_000)).max(20),
  executiveSummary: z.string().min(20).max(6_000),
  knowledgeGaps: z.array(z.string().max(1_000)).max(20),
  relatedEpisodes: z.array(referencedConclusion).max(20),
  temporalEvolution: z.array(referencedConclusion).max(20),
  tensions: z.array(referencedConclusion).max(20),
});

export const evidenceClassificationSchema = z.object({
  classifications: z
    .array(
      z.object({
        confidence: z.number().min(0).max(1),
        evidenceId: z.uuid(),
        evidenceType: z.enum([
          "fact",
          "interpretation",
          "memory",
          "value",
          "counterevidence",
        ]),
        rationale: z.string().min(4).max(700),
        relevance: z.number().min(0).max(1),
        stance: z.enum([
          "supports",
          "complements",
          "contradicts",
          "qualifies",
          "unrelated",
        ]),
      }),
    )
    .max(60),
  conflicts: z
    .array(
      z.object({
        blocksWriting: z.boolean(),
        description: z.string().min(8).max(2_000),
        leftEvidenceId: z.uuid(),
        rightEvidenceId: z.uuid().nullable(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        type: z.enum([
          "factual",
          "temporal",
          "interpretive",
          "value",
          "source",
        ]),
      }),
    )
    .max(30),
});

export type MemoryDossier = z.infer<typeof memoryDossierSchema>;

export function validateDossierReferences(
  dossier: MemoryDossier,
  evidenceIds: Set<string>,
  sourceIds: Set<string>,
) {
  const conclusions = [
    ...dossier.complements,
    ...dossier.contradictions,
    ...dossier.convergences,
    ...dossier.relatedEpisodes,
    ...dossier.temporalEvolution,
    ...dossier.tensions,
  ];
  if (
    !dossier.centralSources.every((id) => sourceIds.has(id)) ||
    !conclusions.every(
      (item) =>
        item.evidenceIds.every((id) => evidenceIds.has(id)) &&
        item.sourceIds.every((id) => sourceIds.has(id)),
    )
  )
    throw new Error("dossier_contains_unknown_references");
  return dossier;
}

export function hasBlockingConflict(
  conflicts: Array<{ blocksWriting: boolean; severity: string }>,
) {
  return conflicts.some(
    (item) =>
      item.blocksWriting && ["high", "critical"].includes(item.severity),
  );
}

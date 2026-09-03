export const BRAIN_PROOF_DATASET_VERSION = "brain-proof-v1";

export const brainProofCases = [
  {
    id: "identity-memory",
    query: "Como a memória participa da identidade?",
    relevantIds: ["book-a-global", "book-a-chapter", "article-b-evidence"],
    expectedSources: ["book-a", "article-b"],
  },
  {
    id: "date-conflict",
    query: "Em que ano ocorreu a mudança?",
    relevantIds: ["note-2024", "record-2025"],
    expectedSources: ["note-c", "record-d"],
    expectsConflict: true,
  },
  {
    id: "interpretive-divergence",
    query: "O silêncio é ausência ou presença?",
    relevantIds: ["essay-presence", "essay-absence"],
    expectedSources: ["essay-e", "essay-f"],
    expectsConflict: true,
  },
] as const;

export const brainProofRankings: Record<
  string,
  Array<{ id: string; sourceId: string }>
> = {
  "identity-memory": [
    { id: "book-a-global", sourceId: "book-a" },
    { id: "article-b-evidence", sourceId: "article-b" },
    { id: "book-a-chapter", sourceId: "book-a" },
  ],
  "date-conflict": [
    { id: "record-2025", sourceId: "record-d" },
    { id: "note-2024", sourceId: "note-c" },
  ],
  "interpretive-divergence": [
    { id: "essay-presence", sourceId: "essay-e" },
    { id: "essay-absence", sourceId: "essay-f" },
  ],
};

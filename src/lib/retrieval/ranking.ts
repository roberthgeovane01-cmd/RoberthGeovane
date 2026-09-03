export type RetrievalCandidate = {
  authority_level: number;
  content: string;
  entity_id: string;
  entity_type: "claim" | "source_chunk" | "source_summary";
  lexical_score: number | null;
  retrieval_level: "evidence" | "global" | "intermediate";
  rrf_score: number;
  source_id: string;
  source_section_id: string | null;
  valid_from: string | null;
  valid_until: string | null;
  vector_score: number | null;
};

export type RankedCandidate = RetrievalCandidate & {
  authorityScore: number;
  diversityPenalty: number;
  finalScore: number;
  selected: boolean;
  specificityScore: number;
  temporalScore: number;
};

export function expandRetrievalQueries(query: string) {
  const original = query.trim().replace(/\s+/g, " ");
  const withoutQuestionWords = original
    .replace(/^(como|onde|por que|porque|quando|qual|quais|quem|o que)\s+/i, "")
    .trim();
  const terms = original
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .slice(0, 10)
    .join(" ");
  return [
    ...new Set([original, withoutQuestionWords, terms].filter(Boolean)),
  ].slice(0, 3);
}

export function rankCandidates(
  candidates: RetrievalCandidate[],
  options: { maxPerSource?: number; selectedCount?: number } = {},
) {
  const maxPerSource = options.maxPerSource ?? 3;
  const selectedCount = options.selectedCount ?? 12;
  const now = Date.now();
  const bestByEntity = new Map<string, RetrievalCandidate>();
  for (const candidate of candidates) {
    const previous = bestByEntity.get(candidate.entity_id);
    if (!previous || candidate.rrf_score > previous.rrf_score) {
      bestByEntity.set(candidate.entity_id, candidate);
    }
  }

  const scored = [...bestByEntity.values()]
    .map((candidate) => {
      const authorityScore = Math.max(
        0,
        Math.min(1, candidate.authority_level / 5),
      );
      const specificityScore =
        candidate.retrieval_level === "evidence"
          ? 1
          : candidate.retrieval_level === "intermediate"
            ? 0.7
            : 0.45;
      const from = candidate.valid_from
        ? Date.parse(candidate.valid_from)
        : null;
      const until = candidate.valid_until
        ? Date.parse(candidate.valid_until)
        : null;
      const temporalScore =
        (from === null || from <= now) && (until === null || until >= now)
          ? 1
          : 0.35;
      const relevance = Math.min(1, candidate.rrf_score * 35);
      const semantic = Math.max(0, candidate.vector_score ?? 0);
      const lexical = Math.min(1, Math.max(0, candidate.lexical_score ?? 0));
      const finalScore =
        relevance * 0.42 +
        semantic * 0.2 +
        lexical * 0.13 +
        authorityScore * 0.1 +
        temporalScore * 0.05 +
        specificityScore * 0.1;
      return {
        ...candidate,
        authorityScore,
        diversityPenalty: 0,
        finalScore,
        selected: false,
        specificityScore,
        temporalScore,
      } satisfies RankedCandidate;
    })
    .sort(
      (a, b) =>
        b.finalScore - a.finalScore || a.entity_id.localeCompare(b.entity_id),
    );

  const sourceCounts = new Map<string, number>();
  let selected = 0;
  return scored.map((candidate) => {
    const count = sourceCounts.get(candidate.source_id) ?? 0;
    if (selected < selectedCount && count < maxPerSource) {
      sourceCounts.set(candidate.source_id, count + 1);
      selected += 1;
      return { ...candidate, selected: true };
    }
    return {
      ...candidate,
      diversityPenalty: count >= maxPerSource ? 1 : 0,
      finalScore:
        count >= maxPerSource
          ? candidate.finalScore * 0.6
          : candidate.finalScore,
    };
  });
}

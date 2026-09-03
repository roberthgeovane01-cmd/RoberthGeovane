export type EvaluationCase = {
  expectedSources: readonly string[];
  relevantIds: readonly string[];
};
export type RetrievedItem = { id: string; sourceId: string };

export function evaluateRetrieval(
  testCase: EvaluationCase,
  retrieved: RetrievedItem[],
  k = 5,
) {
  const top = retrieved.slice(0, k);
  const relevant = new Set(testCase.relevantIds);
  const expectedSources = new Set(testCase.expectedSources);
  const relevantRetrieved = top.filter((item) => relevant.has(item.id)).length;
  const firstRelevant = retrieved.findIndex((item) => relevant.has(item.id));
  const representedSources = new Set(top.map((item) => item.sourceId));
  const coveredSources = new Set(
    top
      .filter((item) => expectedSources.has(item.sourceId))
      .map((item) => item.sourceId),
  );
  return {
    evidenceCoverage: expectedSources.size
      ? coveredSources.size / expectedSources.size
      : 1,
    mrr: firstRelevant < 0 ? 0 : 1 / (firstRelevant + 1),
    precisionAtK: top.length ? relevantRetrieved / top.length : 0,
    recallAtK: relevant.size ? relevantRetrieved / relevant.size : 1,
    sourceDiversity: top.length ? representedSources.size / top.length : 0,
  };
}

export function aggregateMetrics(
  results: ReturnType<typeof evaluateRetrieval>[],
) {
  const keys = [
    "precisionAtK",
    "recallAtK",
    "mrr",
    "sourceDiversity",
    "evidenceCoverage",
  ] as const;
  return Object.fromEntries(
    keys.map((key) => [
      key,
      results.length
        ? results.reduce((sum, item) => sum + item[key], 0) / results.length
        : 0,
    ]),
  );
}

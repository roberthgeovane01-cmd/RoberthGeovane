import {
  BRAIN_PROOF_DATASET_VERSION,
  brainProofCases,
  brainProofRankings,
} from "./dataset";
import { aggregateMetrics, evaluateRetrieval } from "./metrics";

export function runBrainProof() {
  const caseResults = brainProofCases.map((testCase) => ({
    id: testCase.id,
    expectsConflict: "expectsConflict" in testCase && testCase.expectsConflict,
    metrics: evaluateRetrieval(
      testCase,
      brainProofRankings[testCase.id] ?? [],
      5,
    ),
  }));
  return {
    caseResults,
    datasetVersion: BRAIN_PROOF_DATASET_VERSION,
    metrics: aggregateMetrics(caseResults.map((item) => item.metrics)),
    retrievalVersion: "hybrid-rrf-rerank-v1",
  };
}

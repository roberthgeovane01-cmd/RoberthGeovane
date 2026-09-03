import { describe, expect, it } from "vitest";
import { aggregateMetrics, evaluateRetrieval } from "./metrics";

describe("retrieval evaluation metrics", () => {
  const testCase = { relevantIds: ["a", "c"], expectedSources: ["s1", "s2"] };
  it("calculates precision, recall, MRR, diversity and coverage", () => {
    const result = evaluateRetrieval(
      testCase,
      [
        { id: "x", sourceId: "s3" },
        { id: "a", sourceId: "s1" },
        { id: "c", sourceId: "s2" },
      ],
      3,
    );
    expect(result.precisionAtK).toBeCloseTo(2 / 3);
    expect(result.recallAtK).toBe(1);
    expect(result.mrr).toBe(0.5);
    expect(result.sourceDiversity).toBe(1);
    expect(result.evidenceCoverage).toBe(1);
  });
  it("aggregates cases without hiding missing evidence", () => {
    const perfect = evaluateRetrieval(
      testCase,
      [
        { id: "a", sourceId: "s1" },
        { id: "c", sourceId: "s2" },
      ],
      2,
    );
    const empty = evaluateRetrieval(testCase, [], 2);
    expect(aggregateMetrics([perfect, empty]).recallAtK).toBe(0.5);
  });
});

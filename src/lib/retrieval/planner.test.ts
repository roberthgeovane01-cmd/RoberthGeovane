import { describe, expect, it } from "vitest";
import { investigationPlanSchema } from "./planner";

describe("query planner contract", () => {
  it("rejects plans with more than three queries", () => {
    expect(
      investigationPlanSchema.safeParse({
        centralQuestion: "O que mudou?",
        queries: ["uma", "duas", "três", "quatro"],
        temporalHints: [],
        topics: [],
      }).success,
    ).toBe(false);
  });
});

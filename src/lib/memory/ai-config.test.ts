import { describe, expect, it } from "vitest";

import { EMBEDDING_DIMENSIONS, vectorToPostgres } from "./ai-config";

describe("embedding contract", () => {
  it("serializes only vectors in the canonical coordinate space", () => {
    const serialized = vectorToPostgres(Array(EMBEDDING_DIMENSIONS).fill(0));
    expect(serialized.startsWith("[0,0,0")).toBe(true);
    expect(() => vectorToPostgres([0, 1])).toThrow(
      "incompatible_embedding_result",
    );
  });
});

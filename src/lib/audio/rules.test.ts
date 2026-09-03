import { describe, expect, it } from "vitest";

import {
  MAX_AUDIO_BYTES,
  prepareAudioSchema,
  sanitizeAudioFilename,
  validateAudioFile,
} from "./rules";

describe("audio rules", () => {
  it("accepts a valid private audio upload contract", () => {
    expect(
      prepareAudioSchema.safeParse({
        byteSize: 1_024,
        durationMs: 12_000,
        mimeType: "audio/webm",
        originalFilename: "reflexão.webm",
        sha256: "a".repeat(64),
      }).success,
    ).toBe(true);
  });

  it("blocks unsupported and oversized files", () => {
    expect(validateAudioFile({ size: 10, type: "video/mp4" })).toMatch(
      /Formato/,
    );
    expect(
      validateAudioFile({
        size: MAX_AUDIO_BYTES + 1,
        type: "audio/mpeg",
      }),
    ).toMatch(/100 MB/);
  });

  it("sanitizes filenames before building storage paths", () => {
    expect(sanitizeAudioFilename("../../Minha reflexão 01.webm")).toBe(
      "Minha-reflexao-01.webm",
    );
  });
});

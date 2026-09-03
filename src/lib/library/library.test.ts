import { describe, expect, it } from "vitest";

import {
  canonicalDocumentMimeType,
  MAX_DOCUMENT_BYTES,
  sanitizeStorageFilename,
  validateDocumentFile,
} from "./file-rules";
import { normalizeExtractedText, structureText } from "./structure";

describe("document file rules", () => {
  it("accepts the four initial document formats", () => {
    expect(
      validateDocumentFile({
        byteSize: 1_024,
        filename: "livro.pdf",
        mimeType: "application/pdf",
      }),
    ).toBeNull();
    expect(
      validateDocumentFile({
        byteSize: 1_024,
        filename: "notas.md",
        mimeType: "text/plain",
      }),
    ).toBeNull();
  });

  it("rejects mismatched MIME types and oversized files", () => {
    expect(
      validateDocumentFile({
        byteSize: 1_024,
        filename: "livro.pdf",
        mimeType: "image/png",
      }),
    ).toMatch(/não corresponde/i);
    expect(
      validateDocumentFile({
        byteSize: MAX_DOCUMENT_BYTES + 1,
        filename: "livro.pdf",
        mimeType: "application/pdf",
      }),
    ).toMatch(/50 MB/);
  });

  it("sanitizes filenames without losing the extension", () => {
    expect(sanitizeStorageFilename("  Memória / Capítulo 01.PDF")).toBe(
      "Memoria-Capitulo-01.pdf",
    );
  });

  it("normalizes generic browser MIME types for private Storage", () => {
    expect(
      canonicalDocumentMimeType("manuscrito.docx", "application/octet-stream"),
    ).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(canonicalDocumentMimeType("notas.md", "text/plain")).toBe(
      "text/plain",
    );
  });
});

describe("document structure", () => {
  it("normalizes text while preserving paragraph boundaries", () => {
    expect(normalizeExtractedText("A  \r\n\r\n\r\n\r\nB\u0000")).toBe(
      "A\n\n\nB",
    );
  });

  it("creates sections from Markdown headings", () => {
    const sections = structureText(
      "# Primeiro\nTexto um.\n\n## Segundo\nTexto dois.",
      "markdown",
    );

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ heading: "Primeiro", level: 1 });
    expect(sections[1]).toMatchObject({ heading: "Segundo", level: 2 });
  });
});

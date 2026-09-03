import "server-only";

import mammoth from "mammoth";
import { extractText } from "unpdf";

import { getDocumentExtension } from "./file-rules";
import {
  normalizeExtractedText,
  structureText,
  type ExtractedSection,
} from "./structure";

export type DocumentExtraction = {
  extractedText: string;
  pageCount: number | null;
  quality: "good" | "ocr_required";
  sections: ExtractedSection[];
  warnings: string[];
};

function assertSignature(bytes: Uint8Array, extension: string) {
  if (extension === "pdf") {
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") throw new Error("invalid_pdf_signature");
  }

  if (extension === "docx") {
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!isZip) throw new Error("invalid_docx_signature");
  }

  if ((extension === "txt" || extension === "md") && bytes.includes(0)) {
    throw new Error("binary_text_file");
  }
}

export async function extractDocument(
  arrayBuffer: ArrayBuffer,
  filename: string,
): Promise<DocumentExtraction> {
  const extension = getDocumentExtension(filename);
  const bytes = new Uint8Array(arrayBuffer);
  assertSignature(bytes, extension);

  if (extension === "pdf") {
    const result = await extractText(bytes, { mergePages: false });
    const pages = Array.isArray(result.text) ? result.text : [result.text];
    const normalizedPages = pages.map(normalizeExtractedText);
    const extractedText = normalizeExtractedText(normalizedPages.join("\n\n"));
    const hasUsefulText = extractedText.replace(/\s/g, "").length >= 40;

    return {
      extractedText,
      pageCount: result.totalPages,
      quality: hasUsefulText ? "good" : "ocr_required",
      sections: hasUsefulText
        ? normalizedPages
            .map((content, index) => ({
              content,
              heading: `Página ${index + 1}`,
              level: 0,
              locator: { page_end: index + 1, page_start: index + 1 },
              ordinal: index,
            }))
            .filter((section) => section.content)
        : [],
      warnings: hasUsefulText ? [] : ["O PDF não contém texto utilizável."],
    };
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extractedText = normalizeExtractedText(result.value);
    if (!extractedText) throw new Error("empty_text");

    return {
      extractedText,
      pageCount: null,
      quality: "good",
      sections: structureText(extractedText, "docx"),
      warnings: result.messages.map((message) => message.message).slice(0, 20),
    };
  }

  const extractedText = normalizeExtractedText(
    new TextDecoder("utf-8").decode(bytes),
  );
  if (!extractedText) throw new Error("empty_text");

  return {
    extractedText,
    pageCount: null,
    quality: "good",
    sections: structureText(
      extractedText,
      extension === "md" ? "markdown" : "text",
    ),
    warnings: [],
  };
}

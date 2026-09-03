import { z } from "zod";

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
export const STANDARD_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

export const DOCUMENT_ACCEPT = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
].join(",");

export const sourceTypes = [
  "book",
  "document",
  "article",
  "note",
  "other",
] as const;

const allowedMimeTypesByExtension: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  txt: ["text/plain", "application/octet-stream"],
  md: ["text/markdown", "text/plain", "application/octet-stream"],
};

const canonicalMimeTypeByExtension: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown",
  pdf: "application/pdf",
  txt: "text/plain",
};

export function getDocumentExtension(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

export function canonicalDocumentMimeType(filename: string, mimeType: string) {
  return mimeType === "application/octet-stream"
    ? (canonicalMimeTypeByExtension[getDocumentExtension(filename)] ?? mimeType)
    : mimeType;
}

export function sanitizeStorageFilename(filename: string) {
  const extension = getDocumentExtension(filename);
  const base = filename.slice(
    0,
    Math.max(0, filename.length - extension.length - 1),
  );
  const safeBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${safeBase || "documento"}.${extension}`;
}

export function validateDocumentFile(input: {
  byteSize: number;
  filename: string;
  mimeType: string;
}) {
  const extension = getDocumentExtension(input.filename);
  const allowedMimeTypes = allowedMimeTypesByExtension[extension];

  if (!allowedMimeTypes) {
    return "Formato não permitido. Use PDF, DOCX, TXT ou Markdown.";
  }

  if (
    !allowedMimeTypes.includes(input.mimeType || "application/octet-stream")
  ) {
    return "O tipo do arquivo não corresponde à extensão informada.";
  }

  if (!Number.isSafeInteger(input.byteSize) || input.byteSize <= 0) {
    return "O arquivo está vazio ou possui tamanho inválido.";
  }

  if (input.byteSize > MAX_DOCUMENT_BYTES) {
    return "O arquivo excede o limite de 50 MB.";
  }

  return null;
}

export const prepareSourceUploadSchema = z
  .object({
    authorName: z.string().trim().max(240).optional(),
    byteSize: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
    mimeType: z.string().trim().min(1).max(200),
    originalFilename: z.string().trim().min(1).max(255),
    publicationYear: z.number().int().min(1).max(9999).optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sourceType: z.enum(sourceTypes),
    title: z.string().trim().min(1).max(500),
  })
  .superRefine((value, context) => {
    const message = validateDocumentFile({
      byteSize: value.byteSize,
      filename: value.originalFilename,
      mimeType: value.mimeType,
    });

    if (message) {
      context.addIssue({ code: "custom", message, path: ["originalFilename"] });
    }
  });

export type PrepareSourceUploadInput = z.infer<
  typeof prepareSourceUploadSchema
>;

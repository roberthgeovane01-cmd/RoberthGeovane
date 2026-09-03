import { z } from "zod";

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
export const AUDIO_ACCEPT =
  "audio/mpeg,audio/mp4,audio/webm,audio/wav,audio/x-wav,audio/ogg";
export const audioMimeTypes = [
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
] as const;

export const prepareAudioSchema = z.object({
  byteSize: z.number().int().positive().max(MAX_AUDIO_BYTES),
  durationMs: z
    .number()
    .int()
    .min(0)
    .max(12 * 60 * 60 * 1000)
    .optional(),
  mimeType: z.enum(audioMimeTypes),
  originalFilename: z.string().trim().min(1).max(255),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export function sanitizeAudioFilename(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "")
      .slice(0, 120) || "audio.webm"
  );
}

export function validateAudioFile(file: { size: number; type: string }) {
  if (file.size <= 0) return "O áudio está vazio.";
  if (file.size > MAX_AUDIO_BYTES) return "O áudio excede o limite de 100 MB.";
  if (!audioMimeTypes.includes(file.type as (typeof audioMimeTypes)[number])) {
    return "Formato não permitido. Use MP3, MP4, WebM, WAV ou OGG.";
  }
  return null;
}

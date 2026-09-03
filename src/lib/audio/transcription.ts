import { transcribe } from "ai";

export const DEFAULT_TRANSCRIPTION_MODEL = "openai/gpt-4o-mini-transcribe";

export interface SpeechToTextProvider {
  transcribe(audio: Uint8Array): Promise<{
    durationMs?: number;
    language: string;
    model: string;
    provider: string;
    text: string;
  }>;
}

export function isTranscriptionConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  );
}

export class GatewaySpeechToTextProvider implements SpeechToTextProvider {
  readonly model =
    process.env.TRANSCRIPTION_MODEL?.trim() || DEFAULT_TRANSCRIPTION_MODEL;

  async transcribe(audio: Uint8Array) {
    const result = await transcribe({
      audio,
      maxRetries: 2,
      model: this.model,
    });
    return {
      durationMs: result.durationInSeconds
        ? Math.round(result.durationInSeconds * 1000)
        : undefined,
      language: result.language || "pt",
      model: this.model,
      provider: this.model.split("/")[0] || "gateway",
      text: result.text.trim(),
    };
  }
}

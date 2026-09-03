"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleStop, FileAudio, LoaderCircle, Mic, Upload } from "lucide-react";

import {
  cancelAudioUpload,
  prepareAudioUpload,
  transcribeUploadedAudio,
} from "@/app/(workspace)/reflection/new/actions";
import { Button } from "@/components/ui/button";
import {
  AUDIO_ACCEPT,
  audioMimeTypes,
  validateAudioFile,
} from "@/lib/audio/rules";
import { createClient } from "@/utils/supabase/client";

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function AudioCapture() {
  const router = useRouter();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const previewUrlRef = useRef<string | undefined>(undefined);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [durationMs, setDurationMs] = useState<number>();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  function selectFile(nextFile: File, nextDuration?: number) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(nextFile);
    setPreviewUrl(previewUrlRef.current);
    setFile(nextFile);
    setDurationMs(nextDuration);
  }

  async function startRecording() {
    setMessage(undefined);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const preferred = audioMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      recorder.current = new MediaRecorder(
        stream.current,
        preferred ? { mimeType: preferred } : undefined,
      );
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.onstop = () => {
        const type = (recorder.current?.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunks.current, { type });
        const extension = type.includes("mp4") ? "m4a" : "webm";
        selectFile(
          new File([blob], `reflexao-${Date.now()}.${extension}`, { type }),
          Date.now() - startedAt.current,
        );
        stream.current?.getTracks().forEach((track) => track.stop());
      };
      startedAt.current = Date.now();
      recorder.current.start(1_000);
      setRecording(true);
    } catch {
      setMessage(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador.",
      );
    }
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function send() {
    if (!file) return;
    const validation = validateAudioFile(file);
    if (validation) {
      setMessage(validation);
      return;
    }
    setBusy(true);
    setMessage("Preservando o áudio original…");
    let audioId: string | undefined;
    let originalPreserved = false;
    try {
      const prepared = await prepareAudioUpload({
        byteSize: file.size,
        durationMs,
        mimeType: file.type as (typeof audioMimeTypes)[number],
        originalFilename: file.name,
        sha256: await hashFile(file),
      });
      if (!prepared.ok) throw new Error(prepared.message);
      audioId = prepared.audioId;
      const uploaded = await createClient()
        .storage.from("audio-originals")
        .upload(prepared.objectPath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploaded.error) throw uploaded.error;
      originalPreserved = true;
      setMessage("Transcrevendo sua fala…");
      const result = await transcribeUploadedAudio(audioId);
      if (!result.ok) setMessage(result.message);
      router.push(`/reflection/new/${audioId}`);
      router.refresh();
    } catch (error) {
      if (audioId && !originalPreserved) await cancelAudioUpload(audioId);
      setMessage(
        originalPreserved
          ? "O áudio foi preservado, mas a transcrição não respondeu. Abra a captura recente para acompanhar."
          : error instanceof Error
            ? error.message
            : "O envio não foi concluído.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#17233e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(23,35,62,.08)] sm:p-8">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#a6751d]/10 text-[#a6751d]">
          <Mic aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Conte o que aconteceu</h2>
          <p className="mt-1 text-sm text-[#637083]">
            O original será preservado antes da transcrição.
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          className={recording ? "bg-[#8a3d32] hover:bg-[#733128]" : ""}
          disabled={busy}
          onClick={recording ? stopRecording : startRecording}
          type="button"
        >
          {recording ? (
            <CircleStop aria-hidden="true" />
          ) : (
            <Mic aria-hidden="true" />
          )}
          {recording ? "Encerrar gravação" : "Gravar agora"}
        </Button>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#17233e]/15 px-4 text-sm font-semibold hover:bg-[#17233e]/5">
          <Upload aria-hidden="true" size={18} /> Enviar áudio
          <input
            accept={AUDIO_ACCEPT}
            className="sr-only"
            disabled={busy || recording}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                selectFile(selected);
                setMessage(undefined);
              }
            }}
            type="file"
          />
        </label>
      </div>
      {recording ? (
        <p
          aria-live="polite"
          className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#8a3d32]"
        >
          <span className="size-2 animate-pulse rounded-full bg-[#8a3d32]" />
          Gravação em andamento
        </p>
      ) : null}
      {file ? (
        <div className="mt-6 rounded-2xl bg-[#f5f0e5] p-5">
          <div className="flex items-center gap-3">
            <FileAudio className="text-[#a6751d]" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="text-xs text-[#637083]">
                {(file.size / 1_048_576).toFixed(1)} MB
              </p>
            </div>
          </div>
          {previewUrl ? (
            <audio className="mt-4 w-full" controls src={previewUrl}>
              <track kind="captions" />
            </audio>
          ) : null}
          <Button
            className="mt-4 w-full"
            disabled={busy}
            onClick={send}
            type="button"
          >
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            {busy ? "Processando…" : "Preservar e transcrever"}
          </Button>
        </div>
      ) : null}
      {message ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-xl bg-[#17233e]/5 p-4 text-sm"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

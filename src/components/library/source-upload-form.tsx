"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelPreparedSource,
  prepareSourceUpload,
  processUploadedSource,
} from "@/app/(workspace)/library/actions";
import {
  canonicalDocumentMimeType,
  DOCUMENT_ACCEPT,
  STANDARD_UPLOAD_MAX_BYTES,
  sourceTypes,
  validateDocumentFile,
} from "@/lib/library/file-rules";
import { createClient } from "@/utils/supabase/client";
import { getSupabaseEnv } from "@/utils/supabase/env";

const sourceTypeLabels: Record<(typeof sourceTypes)[number], string> = {
  article: "Artigo",
  book: "Livro",
  document: "Documento",
  note: "Nota",
  other: "Outro",
};

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function uploadResumable(
  file: File,
  objectPath: string,
  onProgress: (progress: number) => void,
) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("session_expired");

  const { publishableKey, url } = getSupabaseEnv();
  const endpoint = new URL(url);
  endpoint.hostname = endpoint.hostname.replace(
    ".supabase.co",
    ".storage.supabase.co",
  );
  endpoint.pathname = "/storage/v1/upload/resumable";
  const { Upload } = await import("tus-js-client");

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      chunkSize: 6 * 1024 * 1024,
      endpoint: endpoint.toString(),
      fingerprint: async () =>
        `memoria-reflexiva-${objectPath}-${file.size}-${file.lastModified}`,
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${data.session.access_token}`,
      },
      metadata: {
        bucketName: "library-originals",
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        objectName: objectPath,
      },
      onError: reject,
      onProgress(bytesUploaded, bytesTotal) {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
      removeFingerprintOnSuccess: true,
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      uploadDataDuringCreation: true,
    });

    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads[0])
        upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    });
  });
}

export function SourceUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    { kind: "error" | "success"; message: string } | undefined
  >();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setStatus({ kind: "error", message: "Escolha um arquivo." });
      return;
    }

    const mimeType = canonicalDocumentMimeType(
      file.name,
      file.type || "application/octet-stream",
    );
    const validationError = validateDocumentFile({
      byteSize: file.size,
      filename: file.name,
      mimeType,
    });
    if (validationError) {
      setStatus({ kind: "error", message: validationError });
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatus(undefined);
    let prepared: Awaited<ReturnType<typeof prepareSourceUpload>> | undefined;

    try {
      const publicationYearValue = String(
        formData.get("publicationYear") ?? "",
      ).trim();
      prepared = await prepareSourceUpload({
        authorName: String(formData.get("authorName") ?? ""),
        byteSize: file.size,
        mimeType,
        originalFilename: file.name,
        publicationYear: publicationYearValue
          ? Number(publicationYearValue)
          : undefined,
        sha256: await hashFile(file),
        sourceType: String(
          formData.get("sourceType") ?? "book",
        ) as (typeof sourceTypes)[number],
        title: String(formData.get("title") ?? ""),
      });

      if (!prepared.ok) {
        setStatus({ kind: "error", message: prepared.message });
        if (prepared.code === "duplicate" && prepared.sourceId) {
          router.push(`/library/${prepared.sourceId}`);
        }
        return;
      }

      const supabase = createClient();
      if (file.size <= STANDARD_UPLOAD_MAX_BYTES) {
        const { error } = await supabase.storage
          .from("library-originals")
          .upload(prepared.objectPath, file, {
            cacheControl: "3600",
            contentType: mimeType,
            upsert: false,
          });
        if (error) throw error;
        setProgress(100);
      } else {
        await uploadResumable(file, prepared.objectPath, setProgress);
      }

      const processed = await processUploadedSource({
        sourceId: prepared.sourceId,
        versionId: prepared.versionId,
      });
      setStatus({
        kind: processed.ok ? "success" : "error",
        message: processed.message,
      });

      if (processed.ok) {
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      if (prepared?.ok) {
        await cancelPreparedSource({
          sourceId: prepared.sourceId,
          versionId: prepared.versionId,
        });
      }
      setStatus({
        kind: "error",
        message: "O upload não foi concluído. O registro incompleto foi limpo.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="rounded-[2rem] border border-[#17233e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(23,35,62,0.08)] sm:p-8"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#a6751d]/10 text-[#a6751d]">
          <FileUp aria-hidden="true" size={22} />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Adicionar à Biblioteca
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#637083]">
            O original permanece privado e separado do texto extraído.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold" htmlFor="title">
            Título
          </label>
          <Input id="title" maxLength={500} name="title" required />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="authorName"
          >
            Autor
          </label>
          <Input id="authorName" maxLength={240} name="authorName" />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="publicationYear"
          >
            Ano de publicação
          </label>
          <Input
            id="publicationYear"
            max={9999}
            min={1}
            name="publicationYear"
            type="number"
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="sourceType"
          >
            Tipo
          </label>
          <select
            className="flex h-11 w-full rounded-xl border border-[#17233e]/15 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#a6751d]"
            defaultValue="book"
            id="sourceType"
            name="sourceType"
          >
            {sourceTypes.map((type) => (
              <option key={type} value={type}>
                {sourceTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="file">
            Arquivo
          </label>
          <Input
            accept={DOCUMENT_ACCEPT}
            disabled={busy}
            id="file"
            name="file"
            required
            type="file"
          />
          <p className="mt-2 text-xs text-[#637083]">
            PDF, DOCX, TXT ou MD · até 50 MB
          </p>
        </div>
      </div>

      {busy ? (
        <div className="mt-6" role="status">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#637083]">
            <span>
              {progress < 100 ? "Enviando original" : "Extraindo texto"}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#17233e]/10">
            <div
              aria-label="Progresso do envio"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className="h-full rounded-full bg-[#a6751d] transition-[width]"
              role="progressbar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {status ? (
        <p
          className={`mt-6 rounded-xl border p-4 text-sm ${
            status.kind === "success"
              ? "border-[#536a5b]/20 bg-[#536a5b]/5 text-[#536a5b]"
              : "border-[#8a3d32]/20 bg-[#8a3d32]/5 text-[#8a3d32]"
          }`}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      ) : null}

      <Button className="mt-6 w-full sm:w-auto" disabled={busy} type="submit">
        {busy ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        ) : null}
        {busy ? "Processando…" : "Preservar e processar"}
      </Button>
    </form>
  );
}

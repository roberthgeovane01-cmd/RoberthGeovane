"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, LoaderCircle } from "lucide-react";

import { startSourceMemoryBuild } from "@/app/(workspace)/memory/actions";
import { Button } from "@/components/ui/button";

type BuildMemoryFormProps = {
  aiConfigured: boolean;
  memoryStatus: string;
  sourceId: string;
  versionId: string;
};

export function BuildMemoryForm({
  aiConfigured,
  memoryStatus,
  sourceId,
  versionId,
}: BuildMemoryFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "error" | "success"; message: string } | undefined
  >();

  useEffect(() => {
    if (memoryStatus !== "processing") return;
    const interval = window.setInterval(() => router.refresh(), 4_000);
    return () => window.clearInterval(interval);
  }, [memoryStatus, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(undefined);
    try {
      const result = await startSourceMemoryBuild({
        consent,
        sourceId,
        versionId,
      });
      setFeedback({
        kind: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível iniciar a memória. Tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  }

  const processing = memoryStatus === "processing";

  return (
    <form
      className="rounded-2xl border border-[#17233e]/10 bg-white p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#a6751d]/10 text-[#a6751d]">
          <BrainCircuit aria-hidden="true" size={20} />
        </span>
        <div>
          <h3 className="font-semibold">Construir memória deste documento</h3>
          <p className="mt-1 text-sm leading-6 text-[#637083]">
            Cria chunks rastreáveis, resumos, embeddings, conceitos candidatos e
            afirmações ligadas às evidências originais.
          </p>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f5f0e5]/70 p-4 text-sm leading-6 text-[#4c5668]">
        <input
          checked={consent}
          className="mt-1 size-4 accent-[#a6751d]"
          disabled={busy || processing}
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        <span>
          Autorizo o envio do texto extraído ao provedor de IA para análise. O
          original permanece privado no Supabase.
        </span>
      </label>

      {!aiConfigured ? (
        <p className="mt-3 text-xs leading-5 text-[#a6751d]">
          O processamento poderá criar os chunks, mas aguardará a configuração
          da IA para completar os resumos e embeddings.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={!consent || busy || processing} type="submit">
          {busy || processing ? (
            <LoaderCircle
              className="animate-spin"
              aria-hidden="true"
              size={18}
            />
          ) : (
            <BrainCircuit aria-hidden="true" size={18} />
          )}
          {processing
            ? "Construindo memória"
            : memoryStatus === "ready"
              ? "Reconstruir memória"
              : "Construir memória"}
        </Button>
        {processing ? (
          <span className="text-xs text-[#637083]">
            Você pode sair desta página; o processo continuará.
          </span>
        ) : null}
      </div>

      {feedback ? (
        <p
          className={`mt-4 text-sm ${
            feedback.kind === "error" ? "text-[#8a3d32]" : "text-[#536a5b]"
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}

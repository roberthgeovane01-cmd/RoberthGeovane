import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileAudio, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { approveTranscript } from "@/app/(workspace)/reflection/new/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function TranscriptReviewPage({
  params,
}: {
  params: Promise<{ audioId: string }>;
}) {
  const { audioId } = await params;
  const supabase = await createClient();
  const { data: audio } = await supabase
    .from("audio_entries")
    .select(
      "id, original_filename, status, duration_ms, created_at, transcripts(id, raw_text, approved_text, status, provider, model, confidence, version)",
    )
    .eq("id", audioId)
    .maybeSingle();
  if (!audio) notFound();
  const transcript = [...audio.transcripts].sort(
    (a, b) => b.version - a.version,
  )[0];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#637083]"
        href="/reflection/new"
      >
        <ArrowLeft size={16} />
        Voltar às gravações
      </Link>
      <header className="mt-6 rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d4ae67]">
          Revisão humana obrigatória
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Esta fala representa o que você quis dizer?
        </h1>
        <p className="mt-3 text-white/65">
          Corrija nomes, datas, pontuação e qualquer interpretação antes de
          autorizar a investigação.
        </p>
      </header>
      <section className="mt-6 rounded-2xl border border-[#17233e]/10 bg-white p-5">
        <div className="flex items-center gap-3">
          <FileAudio className="text-[#a6751d]" />
          <div>
            <p className="font-semibold">
              {audio.original_filename ?? "Áudio preservado"}
            </p>
            <p className="text-xs text-[#637083]">Estado: {audio.status}</p>
          </div>
        </div>
        <audio className="mt-4 w-full" controls src={`/api/audio/${audio.id}`}>
          <track kind="captions" />
        </audio>
      </section>
      {transcript ? (
        transcript.status === "approved" ? (
          <section className="mt-6 rounded-[2rem] border border-[#536a5b]/20 bg-[#536a5b]/5 p-7">
            <div className="flex items-center gap-2 font-semibold text-[#536a5b]">
              <CheckCircle2 />
              Transcrição aprovada
            </div>
            <p className="mt-5 whitespace-pre-wrap leading-8">
              {transcript.approved_text}
            </p>
            <Button asChild className="mt-6">
              <Link href="/review">Continuar para a investigação</Link>
            </Button>
          </section>
        ) : (
          <form
            action={approveTranscript}
            className="mt-6 rounded-[2rem] border border-[#17233e]/10 bg-white p-6 sm:p-8"
          >
            <input name="audioId" type="hidden" value={audio.id} />
            <input name="transcriptId" type="hidden" value={transcript.id} />
            <label className="font-semibold" htmlFor="approvedText">
              Transcrição editável
            </label>
            <textarea
              className="mt-3 min-h-80 w-full rounded-2xl border border-[#17233e]/15 p-5 leading-8 outline-none focus-visible:ring-2 focus-visible:ring-[#a6751d]"
              defaultValue={transcript.raw_text}
              id="approvedText"
              maxLength={100000}
              minLength={10}
              name="approvedText"
              required
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#637083]">
              <span>
                {transcript.provider} · {transcript.model}
              </span>
              <span>A versão bruta será preservada.</span>
            </div>
            <Button className="mt-6 w-full sm:w-auto" type="submit">
              <ShieldCheck />
              Aprovar e liberar investigação
            </Button>
          </form>
        )
      ) : (
        <section className="mt-6 rounded-2xl border border-[#8a3d32]/20 bg-[#8a3d32]/5 p-6">
          <h2 className="font-semibold text-[#8a3d32]">
            A transcrição não foi concluída
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#637083]">
            O áudio original permanece guardado. Uma nova tentativa ficará
            disponível quando o provedor estiver operacional.
          </p>
        </section>
      )}
    </div>
  );
}

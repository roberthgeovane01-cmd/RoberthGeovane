import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";

import { AudioCapture } from "@/components/reflection/audio-capture";
import { createClient } from "@/utils/supabase/server";

export default async function NewReflectionPage() {
  const supabase = await createClient();
  const { data: audios } = await supabase
    .from("audio_entries")
    .select("id, original_filename, status, created_at, duration_ms")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6751d]">
          Fala atual
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
          Nova reflexão
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-[#637083]">
          Grave ou envie um áudio. A transcrição continuará bloqueada para
          escrita até que você revise e aprove cada palavra.
        </p>
      </header>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
        <AudioCapture />
        <section aria-labelledby="recent-audio-title">
          <h2 className="text-xl font-semibold" id="recent-audio-title">
            Capturas recentes
          </h2>
          <div className="mt-4 space-y-3">
            {(audios ?? []).length ? (
              audios?.map((audio) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#17233e]/10 bg-white p-5 hover:border-[#a6751d]/35"
                  href={`/reflection/new/${audio.id}`}
                  key={audio.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {audio.original_filename ?? "Gravação"}
                    </p>
                    <p className="mt-1 text-xs text-[#637083]">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      }).format(new Date(audio.created_at))}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-[#637083]">
                    {audio.status === "ready" ? (
                      <CheckCircle2 className="text-[#536a5b]" size={17} />
                    ) : (
                      <Clock3 className="text-[#a6751d]" size={17} />
                    )}
                    {audio.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#17233e]/20 p-6 text-sm text-[#637083]">
                Nenhuma fala capturada ainda.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

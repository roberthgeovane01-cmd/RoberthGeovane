import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, FileWarning } from "lucide-react";

import { SourceUploadForm } from "@/components/library/source-upload-form";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

const statusPresentation: Record<string, { label: string; tone: string }> = {
  archived: { label: "Arquivado", tone: "bg-[#637083]/10 text-[#637083]" },
  draft: { label: "Rascunho", tone: "bg-[#637083]/10 text-[#637083]" },
  failed: { label: "Falhou", tone: "bg-[#8a3d32]/10 text-[#8a3d32]" },
  processing: { label: "Processando", tone: "bg-[#a6751d]/10 text-[#a6751d]" },
  ready: { label: "Disponível", tone: "bg-[#536a5b]/10 text-[#536a5b]" },
  uploading: { label: "Enviando", tone: "bg-[#a6751d]/10 text-[#a6751d]" },
};

function formatBytes(bytes: number) {
  const megabytes = bytes >= 1_048_576;
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: megabytes ? "megabyte" : "kilobyte",
    unitDisplay: "short",
  }).format(bytes / (megabytes ? 1_048_576 : 1_024));
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: sources, error } = await supabase
    .from("sources")
    .select(
      "id, title, author_name, source_type, status, created_at, source_versions(id, original_filename, byte_size, extraction_status, created_at)",
    )
    .order("created_at", { ascending: false });

  const readyCount =
    sources?.filter((source) => source.status === "ready").length ?? 0;
  const attentionCount =
    sources?.filter(
      (source) => source.status === "failed" || source.status === "processing",
    ).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a6751d]">
            Fase 2 · Biblioteca
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Fontes preservadas
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#637083]">
            Livros e documentos entram como originais privados, versões
            verificadas e texto estruturado antes de participar da memória.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-[#536a5b]/10 px-4 py-2 font-semibold text-[#536a5b]">
            {readyCount} disponíveis
          </span>
          {attentionCount > 0 ? (
            <span className="rounded-full bg-[#a6751d]/10 px-4 py-2 font-semibold text-[#a6751d]">
              {attentionCount} em atenção
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <section aria-labelledby="library-list-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold" id="library-list-title">
              Acervo
            </h2>
            <span className="text-sm text-[#637083]">
              {sources?.length ?? 0} fontes
            </span>
          </div>

          {error ? (
            <p className="rounded-2xl border border-[#8a3d32]/20 bg-[#8a3d32]/5 p-5 text-sm text-[#8a3d32]">
              Não foi possível consultar a Biblioteca.
            </p>
          ) : sources && sources.length > 0 ? (
            <ul className="space-y-4">
              {sources.map((source) => {
                const version = [...source.source_versions].sort((a, b) =>
                  b.created_at.localeCompare(a.created_at),
                )[0];
                const presentation =
                  statusPresentation[source.status] ?? statusPresentation.draft;
                const StatusIcon =
                  source.status === "ready"
                    ? CheckCircle2
                    : source.status === "failed"
                      ? FileWarning
                      : Clock3;

                return (
                  <li key={source.id}>
                    <Link
                      className="block rounded-[1.75rem] border border-[#17233e]/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#a6751d]/30 hover:shadow-[0_18px_55px_rgba(23,35,62,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6751d]"
                      href={`/library/${source.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#17233e]/5 text-[#17233e]">
                          <BookOpen aria-hidden="true" size={20} />
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${presentation.tone}`}
                        >
                          <StatusIcon aria-hidden="true" size={14} />
                          {presentation.label}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">
                        {source.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#637083]">
                        {source.author_name || "Autor não informado"}
                      </p>
                      {version ? (
                        <p className="mt-4 truncate border-t border-[#17233e]/8 pt-4 text-xs text-[#637083]">
                          {version.original_filename} ·{" "}
                          {formatBytes(version.byte_size)}
                          {version.extraction_status === "ocr_required"
                            ? " · OCR necessário"
                            : ""}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#17233e]/20 p-8 text-center">
              <BookOpen
                aria-hidden="true"
                className="mx-auto text-[#a6751d]"
                size={30}
              />
              <h3 className="mt-4 font-semibold">Sua Biblioteca começa aqui</h3>
              <p className="mt-2 text-sm leading-6 text-[#637083]">
                Adicione o primeiro livro ou documento. Nada será usado pela
                memória antes da extração e da validação.
              </p>
            </div>
          )}
        </section>

        <aside>
          <SourceUploadForm />
        </aside>
      </div>
    </div>
  );
}

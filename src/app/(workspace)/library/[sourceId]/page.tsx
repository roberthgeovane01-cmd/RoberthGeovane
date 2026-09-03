import Link from "next/link";
import { ArrowLeft, Download, FileText, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

type SourcePageProps = {
  params: Promise<{ sourceId: string }>;
};

const extractionLabels: Record<string, string> = {
  failed: "Extração falhou",
  ocr_required: "OCR necessário",
  processing: "Extraindo texto",
  queued: "Aguardando extração",
  ready: "Texto extraído",
};

export default async function SourcePage({ params }: SourcePageProps) {
  const { sourceId } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase
    .from("sources")
    .select(
      "id, title, author_name, publication_year, source_type, status, created_at",
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (!source) notFound();

  const { data: versions } = await supabase
    .from("source_versions")
    .select(
      "id, version, original_filename, mime_type, byte_size, sha256, extraction_status, page_count, created_at",
    )
    .eq("source_id", source.id)
    .order("version", { ascending: false });
  const currentVersion = versions?.[0];

  const { data: sections } = currentVersion
    ? await supabase
        .from("source_sections")
        .select("id, ordinal, level, heading, locator, content")
        .eq("source_version_id", currentVersion.id)
        .order("ordinal")
        .limit(200)
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#637083] hover:text-[#17233e]"
        href="/library"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Voltar à Biblioteca
      </Link>

      <header className="mt-7 rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4ae67]">
          {source.source_type} · versão {currentVersion?.version ?? 1}
        </p>
        <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {source.title}
            </h1>
            <p className="mt-3 text-white/65">
              {[source.author_name, source.publication_year]
                .filter(Boolean)
                .join(" · ") || "Autoria não informada"}
            </p>
          </div>
          {currentVersion ? (
            <Button
              asChild
              className="shrink-0 bg-[#d4ae67] text-[#17233e] hover:bg-white"
            >
              <a href={`/api/library/sources/${source.id}/download`}>
                <Download aria-hidden="true" size={18} />
                Baixar original
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {currentVersion ? (
        <section
          className="mt-6 grid gap-4 sm:grid-cols-3"
          aria-label="Integridade do documento"
        >
          <div className="rounded-2xl border border-[#17233e]/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#637083]">
              Extração
            </p>
            <p className="mt-2 font-semibold">
              {extractionLabels[currentVersion.extraction_status] ??
                "Estado desconhecido"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#17233e]/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#637083]">
              Estrutura
            </p>
            <p className="mt-2 font-semibold">
              {sections?.length ?? 0}{" "}
              {(sections?.length ?? 0) === 1 ? "seção" : "seções"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#17233e]/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#637083]">
              Integridade
            </p>
            <p
              className={`mt-2 flex items-center gap-2 font-semibold ${
                currentVersion.extraction_status === "ready" ||
                currentVersion.extraction_status === "ocr_required"
                  ? "text-[#536a5b]"
                  : "text-[#637083]"
              }`}
            >
              <ShieldCheck aria-hidden="true" size={18} />
              {currentVersion.extraction_status === "ready" ||
              currentVersion.extraction_status === "ocr_required"
                ? "SHA-256 verificado"
                : "Verificação pendente"}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-9" aria-labelledby="sections-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6751d]">
              Texto derivado
            </p>
            <h2 className="mt-2 text-2xl font-semibold" id="sections-title">
              Estrutura identificada
            </h2>
          </div>
          {currentVersion?.page_count ? (
            <span className="text-sm text-[#637083]">
              {currentVersion.page_count} páginas
            </span>
          ) : null}
        </div>

        {currentVersion?.extraction_status === "ocr_required" ? (
          <div className="mt-5 rounded-2xl border border-[#a6751d]/20 bg-[#a6751d]/5 p-5 text-sm leading-6 text-[#7b5718]">
            O original foi preservado, mas o PDF não contém texto confiável. Ele
            não entrará na memória até que uma etapa de OCR seja configurada e
            revisada.
          </div>
        ) : sections && sections.length > 0 ? (
          <ol className="mt-5 space-y-4">
            {sections.map((section) => (
              <li
                className="rounded-2xl border border-[#17233e]/10 bg-white p-5 sm:p-6"
                key={section.id}
              >
                <div className="flex items-center gap-3 text-xs text-[#637083]">
                  <FileText aria-hidden="true" size={16} />
                  <span>Seção {section.ordinal + 1}</span>
                  {typeof section.locator === "object" &&
                  section.locator &&
                  "page_start" in section.locator ? (
                    <span>· Página {String(section.locator.page_start)}</span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-semibold">
                  {section.heading || `Trecho ${section.ordinal + 1}`}
                </h3>
                <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-7 text-[#637083]">
                  {section.content || "Seção sem conteúdo textual."}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-[#17233e]/20 p-6 text-sm text-[#637083]">
            A estrutura ainda não está disponível.
          </p>
        )}
      </section>
    </div>
  );
}

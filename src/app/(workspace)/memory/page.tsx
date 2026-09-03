import Link from "next/link";
import {
  BookOpenText,
  Brain,
  FileSearch,
  Fingerprint,
  Quote,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function MemoryPage() {
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#17233e]/20 p-8">
        <h1 className="text-3xl font-semibold">Memória</h1>
        <p className="mt-3 text-[#637083]">
          O espaço de trabalho ainda não está disponível.
        </p>
      </div>
    );
  }

  const [
    readyVersions,
    chunks,
    concepts,
    claims,
    summariesResult,
    claimsResult,
    conceptsResult,
  ] = await Promise.all([
    supabase
      .from("source_versions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("memory_status", "ready"),
    supabase
      .from("source_chunks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "active"),
    supabase
      .from("source_concepts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .in("status", ["candidate", "verified"]),
    supabase
      .from("source_summaries")
      .select("id, content, source_id, sources(id, title)")
      .eq("workspace_id", workspace.id)
      .eq("summary_kind", "source")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("claims")
      .select(
        "id, statement, confidence, status, source_id, sources(id, title), claim_evidence(excerpt, source_chunk_id)",
      )
      .eq("workspace_id", workspace.id)
      .in("status", ["candidate", "verified"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("concepts")
      .select("id, name, description, status")
      .eq("workspace_id", workspace.id)
      .in("status", ["candidate", "active"])
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const summaries = summariesResult.data ?? [];
  const recentClaims = claimsResult.data ?? [];
  const recentConcepts = conceptsResult.data ?? [];
  const stats: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    {
      label: "Fontes prontas",
      value: readyVersions.count ?? 0,
      Icon: BookOpenText,
    },
    { label: "Chunks ativos", value: chunks.count ?? 0, Icon: FileSearch },
    { label: "Conceitos", value: concepts.count ?? 0, Icon: Fingerprint },
    { label: "Afirmações", value: claims.count ?? 0, Icon: Quote },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#d4ae67]">
            <Brain aria-hidden="true" size={25} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4ae67]">
              Memória antes da escrita
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Memória estruturada
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
              Resumos, conceitos e afirmações permanecem ligados aos chunks e às
              fontes que lhes dão origem. Conceitos são candidatos — não fatos.
            </p>
            <Button
              asChild
              className="mt-6 bg-[#d4ae67] text-[#17233e] hover:bg-[#e2c384]"
            >
              <Link href="/memory/search">Buscar na memória</Link>
            </Button>
          </div>
        </div>
      </header>

      <section
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Indicadores da memória"
      >
        {stats.map(({ label, value, Icon }) => (
          <div
            className="rounded-2xl border border-[#17233e]/10 bg-white p-5"
            key={label}
          >
            <Icon aria-hidden="true" className="text-[#a6751d]" size={20} />
            <p className="mt-5 text-3xl font-semibold text-[#17233e]">
              {value}
            </p>
            <p className="mt-1 text-sm text-[#637083]">{label}</p>
          </div>
        ))}
      </section>

      {summaries.length === 0 ? (
        <section className="mt-8 rounded-[2rem] border border-dashed border-[#17233e]/20 bg-white p-8 text-center sm:p-12">
          <Brain
            className="mx-auto text-[#a6751d]"
            aria-hidden="true"
            size={30}
          />
          <h2 className="mt-5 text-2xl font-semibold">
            A memória ainda está vazia
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#637083]">
            Adicione um documento à Biblioteca, conclua a extração e autorize a
            construção da memória. Nenhum conteúdo é apresentado como processado
            antes dessas etapas.
          </p>
          <Button asChild className="mt-6">
            <Link href="/library">Abrir Biblioteca</Link>
          </Button>
        </section>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <section aria-labelledby="summaries-title">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6751d]">
                Visão global
              </p>
              <h2 className="mt-2 text-2xl font-semibold" id="summaries-title">
                Resumos das fontes
              </h2>
              <div className="mt-5 space-y-4">
                {summaries.map((summary) => (
                  <article
                    className="rounded-2xl border border-[#17233e]/10 bg-white p-5 sm:p-6"
                    key={summary.id}
                  >
                    <Link
                      className="font-semibold text-[#17233e] hover:text-[#a6751d]"
                      href={`/library/${summary.source_id}`}
                    >
                      {summary.sources?.title ?? "Fonte"}
                    </Link>
                    <p className="mt-3 line-clamp-6 text-sm leading-7 text-[#637083]">
                      {summary.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="claims-title">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6751d]">
                Rastreabilidade
              </p>
              <h2 className="mt-2 text-2xl font-semibold" id="claims-title">
                Afirmações e evidências
              </h2>
              <div className="mt-5 space-y-3">
                {recentClaims.map((claim) => (
                  <article
                    className="rounded-2xl border border-[#17233e]/10 bg-white p-5"
                    key={claim.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#637083]">
                      <span>{claim.sources?.title ?? "Fonte preservada"}</span>
                      <span>
                        {Math.round(claim.confidence * 100)}% de confiança
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6">
                      {claim.statement}
                    </p>
                    {claim.claim_evidence[0]?.excerpt ? (
                      <blockquote className="mt-3 border-l-2 border-[#d4ae67] pl-4 text-sm italic leading-6 text-[#637083]">
                        “{claim.claim_evidence[0].excerpt}”
                      </blockquote>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside aria-labelledby="concepts-title">
            <div className="rounded-[2rem] border border-[#17233e]/10 bg-[#f5f0e5]/70 p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6751d]">
                Candidatos semânticos
              </p>
              <h2 className="mt-2 text-2xl font-semibold" id="concepts-title">
                Conceitos identificados
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#637083]">
                Estes temas apoiam a investigação futura, mas não são tratados
                automaticamente como fatos confirmados.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {recentConcepts.map((concept) => (
                  <span
                    className="rounded-full border border-[#17233e]/10 bg-white px-4 py-2 text-sm font-semibold text-[#17233e]"
                    key={concept.id}
                    title={concept.description ?? undefined}
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

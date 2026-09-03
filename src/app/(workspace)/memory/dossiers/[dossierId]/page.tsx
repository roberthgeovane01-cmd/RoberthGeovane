import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MemoryDossier } from "@/lib/dossiers/schemas";
import { createClient } from "@/utils/supabase/server";
import { approveDossier, resolveConflict } from "../actions";

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ dossierId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { dossierId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: dossier }, { data: evidence }, { data: conflicts }] =
    await Promise.all([
      supabase
        .from("memory_dossiers")
        .select(
          "id, title, question, executive_summary, dossier, status, evidence_coverage, created_at",
        )
        .eq("id", dossierId)
        .maybeSingle(),
      supabase
        .from("dossier_evidence")
        .select(
          "id, stance, evidence_type, excerpt, relevance, confidence, classification_rationale, retrieval_hits(source_id, sources(title))",
        )
        .eq("memory_dossier_id", dossierId)
        .order("relevance", { ascending: false }),
      supabase
        .from("conflicts")
        .select(
          "id, description, conflict_type, severity, blocks_writing, status",
        )
        .eq("memory_dossier_id", dossierId)
        .order("created_at"),
    ]);
  if (!dossier) notFound();
  const body = dossier.dossier as unknown as MemoryDossier;
  const groups = [
    ["Convergências", body.convergences],
    ["Complementos", body.complements],
    ["Tensões", body.tensions],
    ["Contradições", body.contradictions],
    ["Evolução temporal", body.temporalEvolution],
  ] as const;
  const openBlocking = (conflicts ?? []).some(
    (item) => item.blocks_writing && ["open", "review"].includes(item.status),
  );
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#637083]"
        href="/memory/search"
      >
        <ArrowLeft size={16} /> Voltar à investigação
      </Link>
      <header className="mt-5 rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4ae67]">
          Memory Analyst · não literário
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{dossier.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-white/70">
          {dossier.executive_summary}
        </p>
        <div className="mt-5 flex gap-3 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {dossier.status}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            cobertura {Math.round((dossier.evidence_coverage ?? 0) * 100)}%
          </span>
        </div>
      </header>
      {query.error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Existem conflitos críticos sem resolução. O dossiê ainda não pode ser
          aprovado.
        </p>
      ) : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <main className="space-y-6">
          {groups.map(([title, items]) => (
            <section
              className="rounded-2xl border border-[#17233e]/10 bg-white p-6"
              key={title}
            >
              <h2 className="text-xl font-semibold">{title}</h2>
              {items?.length ? (
                <ul className="mt-4 space-y-4">
                  {items.map((item, index) => (
                    <li
                      className="border-t border-[#17233e]/10 pt-4"
                      key={`${title}-${index}`}
                    >
                      <p className="leading-7">{item.text}</p>
                      <p className="mt-2 text-xs text-[#637083]">
                        {item.evidenceIds.length} evidência(s) ·{" "}
                        {item.sourceIds.length} fonte(s)
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#637083]">
                  Nada identificado com segurança.
                </p>
              )}
            </section>
          ))}
        </main>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#17233e]/10 bg-white p-6">
            <h2 className="text-xl font-semibold">Evidências</h2>
            <div className="mt-4 space-y-4">
              {(evidence ?? []).map((item) => (
                <article
                  className="border-t border-[#17233e]/10 pt-4"
                  key={item.id}
                >
                  <p className="text-xs font-semibold uppercase text-[#a6751d]">
                    {item.stance} · {item.evidence_type}
                  </p>
                  <p className="mt-2 line-clamp-5 text-sm leading-6">
                    {item.excerpt}
                  </p>
                  <p className="mt-2 text-xs text-[#637083]">
                    {item.retrieval_hits?.sources?.title ?? "Fonte"} ·
                    relevância {Math.round((item.relevance ?? 0) * 100)}%
                  </p>
                </article>
              ))}
            </div>
          </section>
          {(conflicts ?? []).length ? (
            <section className="rounded-2xl border border-[#8a3d32]/30 bg-[#8a3d32]/5 p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <AlertTriangle size={20} /> Conflitos
              </h2>
              {conflicts!.map((item) => (
                <article
                  className="mt-4 border-t border-[#8a3d32]/20 pt-4"
                  key={item.id}
                >
                  <p className="font-semibold">
                    {item.conflict_type} · {item.severity}
                  </p>
                  <p className="mt-2 text-sm leading-6">{item.description}</p>
                  {item.status !== "resolved" ? (
                    <form action={resolveConflict} className="mt-3 space-y-2">
                      <input type="hidden" name="conflictId" value={item.id} />
                      <input
                        type="hidden"
                        name="dossierId"
                        value={dossier.id}
                      />
                      <select
                        className="w-full rounded-lg border p-2 text-sm"
                        name="resolution"
                      >
                        <option value="preserve_tension">
                          Preservar tensão
                        </option>
                        <option value="prefer_left">
                          Preferir primeira evidência
                        </option>
                        <option value="prefer_right">
                          Preferir segunda evidência
                        </option>
                        <option value="synthesize">Sintetizar</option>
                        <option value="insufficient_evidence">
                          Evidência insuficiente
                        </option>
                        <option value="dismiss">Descartar conflito</option>
                      </select>
                      <input
                        className="w-full rounded-lg border p-2 text-sm"
                        name="notes"
                        placeholder="Justificativa da decisão"
                        required
                      />
                      <Button type="submit">Registrar decisão</Button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-green-700">
                      Resolvido
                    </p>
                  )}
                </article>
              ))}
            </section>
          ) : null}
          <form action={approveDossier}>
            <input type="hidden" name="dossierId" value={dossier.id} />
            <Button
              className="w-full gap-2"
              disabled={openBlocking || dossier.status === "approved"}
              type="submit"
            >
              <CheckCircle2 size={17} />
              {dossier.status === "approved"
                ? "Dossiê aprovado"
                : openBlocking
                  ? "Resolva conflitos críticos"
                  : "Aprovar dossiê"}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

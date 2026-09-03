import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brainProofCases } from "@/lib/evaluation/dataset";
import { createClient } from "@/utils/supabase/server";
import { runEvaluation } from "./actions";

const labels: Record<string, string> = {
  precisionAtK: "Precisão@K",
  recallAtK: "Recall@K",
  mrr: "MRR",
  sourceDiversity: "Diversidade",
  evidenceCoverage: "Cobertura",
};
export default async function EvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("retrieval_evaluations")
    .select("id, name, dataset_version, retrieval_version, metrics, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#637083]"
        href="/memory"
      >
        <ArrowLeft size={16} /> Voltar à memória
      </Link>
      <header className="mt-5 rounded-[2rem] bg-[#17233e] p-8 text-white">
        <FlaskConical className="text-[#d4ae67]" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.22em] text-[#d4ae67]">
          Avaliação separada da prosa
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Prova do cérebro</h1>
        <p className="mt-3 max-w-3xl leading-7 text-white/65">
          Dataset fictício isolado com {brainProofCases.length} investigações
          canônicas, incluindo conflito factual e divergência interpretativa.
        </p>
        <form action={runEvaluation} className="mt-6">
          <Button type="submit">Executar avaliação</Button>
        </form>
      </header>
      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">
          Não foi possível salvar o relatório.
        </p>
      ) : null}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Histórico de resultados</h2>
        {reports?.length ? (
          <div className="mt-5 space-y-4">
            {reports.map((report) => {
              const metrics = report.metrics as Record<string, number>;
              return (
                <article
                  className="rounded-2xl border border-[#17233e]/10 bg-white p-6"
                  key={report.id}
                >
                  <h3 className="font-semibold">{report.name}</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-5">
                    {Object.entries(labels).map(([key, label]) => (
                      <div className="rounded-xl bg-[#17233e]/5 p-3" key={key}>
                        <p className="text-2xl font-semibold">
                          {Math.round((metrics[key] ?? 0) * 100)}%
                        </p>
                        <p className="text-xs text-[#637083]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[#637083]">
                    {report.dataset_version} · {report.retrieval_version}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed p-7 text-[#637083]">
            Nenhuma avaliação persistida ainda.
          </p>
        )}
      </section>
    </div>
  );
}

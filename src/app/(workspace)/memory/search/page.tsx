import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

import { searchMemory } from "./actions";

export default async function MemorySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; session?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: session } = params.session
    ? await supabase
        .from("retrieval_sessions")
        .select("id, user_query, parameters, status, completed_at")
        .eq("id", params.session)
        .maybeSingle()
    : { data: null };
  const { data: hits } = session
    ? await supabase
        .from("retrieval_hits")
        .select(
          "id, entity_type, retrieval_level, final_score, lexical_score, vector_score, rrf_score, selected, rationale, sources(id, title, author_name), source_chunks(content, locator), claims(statement), source_summaries(content, summary_kind), source_sections(heading)",
        )
        .eq("retrieval_session_id", session.id)
        .order("rank")
    : { data: [] };
  const selectedHits = (hits ?? []).filter((hit) => hit.selected);
  const discardedHits = (hits ?? []).filter((hit) => !hit.selected);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#637083] hover:text-[#17233e]"
        href="/memory"
      >
        <ArrowLeft size={16} /> Voltar à memória
      </Link>
      <header className="mt-5 rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4ae67]">
          Recuperação rastreável
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Buscar na memória
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
          Combina termos em português, significado, hierarquia e diversidade de
          fontes. Cada seleção e descarte fica registrado.
        </p>
      </header>

      <form
        action={searchMemory}
        className="mt-6 rounded-[2rem] border border-[#17233e]/10 bg-white p-5 sm:p-7"
      >
        <label className="text-sm font-semibold" htmlFor="query">
          Pergunta ou tema
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="min-h-12 flex-1 rounded-xl border border-[#17233e]/15 px-4 outline-none focus:border-[#a6751d]"
            id="query"
            name="query"
            placeholder="Ex.: O que minhas fontes dizem sobre memória e identidade?"
            required
            minLength={3}
          />
          <Button className="min-h-12 gap-2" type="submit">
            <Search size={17} /> Buscar
          </Button>
        </div>
        <div className="mt-5 grid gap-3 border-t border-[#17233e]/10 pt-5 sm:grid-cols-3">
          <label className="text-xs font-semibold text-[#637083]">
            Autor
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-[#17233e]/15 px-3 text-sm"
              name="author"
            />
          </label>
          <label className="text-xs font-semibold text-[#637083]">
            Tipo
            <select
              className="mt-2 min-h-11 w-full rounded-xl border border-[#17233e]/15 px-3 text-sm"
              name="sourceType"
            >
              <option value="">Todos</option>
              <option value="book">Livro</option>
              <option value="document">Documento</option>
              <option value="article">Artigo</option>
              <option value="note">Nota</option>
              <option value="web">Web</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#637083]">
            Autoridade mínima
            <select
              className="mt-2 min-h-11 w-full rounded-xl border border-[#17233e]/15 px-3 text-sm"
              name="authority"
            >
              <option value="">Qualquer</option>
              <option value="3">3 — moderada</option>
              <option value="4">4 — alta</option>
              <option value="5">5 — máxima</option>
            </select>
          </label>
        </div>
      </form>

      {params.error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível executar a busca. Revise os campos e tente novamente.
        </p>
      ) : null}
      {session ? (
        <section className="mt-8" aria-labelledby="results-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6751d]">
                Resultado auditável
              </p>
              <h2 className="mt-2 text-2xl font-semibold" id="results-title">
                {session.user_query}
              </h2>
            </div>
            <span className="rounded-full bg-[#17233e]/5 px-3 py-1 text-xs text-[#637083]">
              {selectedHits.length} selecionados · {discardedHits.length}{" "}
              preservados
            </span>
          </div>
          {selectedHits.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#17233e]/20 p-7 text-[#637083]">
              Nenhuma evidência correspondente foi encontrada nas fontes
              prontas.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {selectedHits.map((hit) => (
                <article
                  className="rounded-2xl border border-[#17233e]/10 bg-white p-5"
                  key={hit.id}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#637083]">
                    <span className="rounded-full bg-[#d4ae67]/15 px-2.5 py-1 font-semibold text-[#7b5617]">
                      {hit.retrieval_level}
                    </span>
                    <span>{hit.sources?.title ?? "Fonte"}</span>
                    {hit.source_sections?.heading ? (
                      <span>· {hit.source_sections.heading}</span>
                    ) : null}
                  </div>
                  <p className="mt-4 line-clamp-6 leading-7 text-[#29354a]">
                    {hit.source_chunks?.content ??
                      hit.claims?.statement ??
                      hit.source_summaries?.content}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#637083]">
                    <span>final {(hit.final_score ?? 0).toFixed(3)}</span>
                    <span>vetor {(hit.vector_score ?? 0).toFixed(3)}</span>
                    <span>lexical {(hit.lexical_score ?? 0).toFixed(3)}</span>
                    <span>RRF {(hit.rrf_score ?? 0).toFixed(4)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
          {discardedHits.length > 0 ? (
            <details className="mt-6 rounded-2xl border border-[#17233e]/10 bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold">
                <SlidersHorizontal className="mr-2 inline" size={16} />
                Ver candidatos descartados
              </summary>
              <ul className="mt-4 space-y-3 text-sm text-[#637083]">
                {discardedHits.map((hit) => (
                  <li
                    className="border-t border-[#17233e]/10 pt-3"
                    key={hit.id}
                  >
                    {hit.sources?.title ?? "Fonte"}: {hit.rationale}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  GitBranch,
  History,
  MessageSquareWarning,
  Quote,
  Search,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

const sections = [
  ["Fontes", "sources", BookOpenText],
  ["Conceitos", "concepts", Sparkles],
  ["Afirmações", "claims", Quote],
  ["Memórias", "memories", Brain],
  ["Relações", "relations", GitBranch],
  ["Episódios", "episodes", History],
  ["Reflexões", "reflections", GitBranch],
  ["Divergências", "conflicts", MessageSquareWarning],
] as const;

type ResultItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  meta?: string;
};

export default async function MemoryExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim().slice(0, 200) ?? "";
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const results: Record<string, ResultItem[]> = Object.fromEntries(
    sections.map(([, key]) => [key, []]),
  );

  if (workspace && query.length >= 2) {
    const pattern = `%${query}%`;
    const [
      sources,
      concepts,
      claims,
      memories,
      episodes,
      reflections,
      conflicts,
    ] = await Promise.all([
      supabase
        .from("sources")
        .select("id, title, author_name, source_type")
        .eq("workspace_id", workspace.id)
        .ilike("title", pattern)
        .limit(12),
      supabase
        .from("concepts")
        .select("id, name, description, status")
        .eq("workspace_id", workspace.id)
        .ilike("name", pattern)
        .limit(12),
      supabase
        .from("claims")
        .select("id, statement, confidence, status, source_id, sources(title)")
        .eq("workspace_id", workspace.id)
        .ilike("statement", pattern)
        .limit(12),
      supabase
        .from("memories")
        .select("id, title, content, memory_type, confidence")
        .eq("workspace_id", workspace.id)
        .ilike("content", pattern)
        .limit(12),
      supabase
        .from("episodes")
        .select("id, title, summary, occurred_from")
        .eq("workspace_id", workspace.id)
        .ilike("summary", pattern)
        .limit(12),
      supabase
        .from("reflection_versions")
        .select("id, content, version, status, reflection_id")
        .eq("workspace_id", workspace.id)
        .ilike("content", pattern)
        .limit(12),
      supabase
        .from("conflicts")
        .select(
          "id, description, conflict_type, severity, status, memory_dossier_id",
        )
        .eq("workspace_id", workspace.id)
        .ilike("description", pattern)
        .limit(12),
    ]);
    results.sources = (sources.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.author_name ?? "Autoria não informada",
      href: `/library/${item.id}`,
      meta: item.source_type,
    }));
    results.concepts = (concepts.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      description: item.description ?? "Conceito sem descrição",
      meta: item.status,
    }));
    results.claims = (claims.data ?? []).map((item) => ({
      id: item.id,
      title: item.statement,
      description: item.sources?.title ?? "Fonte preservada",
      href: item.source_id ? `/library/${item.source_id}` : undefined,
      meta: `${Math.round(item.confidence * 100)}% confiança`,
    }));
    results.memories = (memories.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.content,
      meta: `${item.memory_type} · ${Math.round(item.confidence * 100)}%`,
    }));
    const memoryIds = new Set((memories.data ?? []).map((item) => item.id));
    if (memoryIds.size > 0) {
      const { data: relations } = await supabase
        .from("memory_relations")
        .select("id, relation_type, weight, source_memory_id, target_memory_id")
        .eq("workspace_id", workspace.id)
        .eq("status", "active")
        .limit(100);
      const memoryTitles = new Map(
        (memories.data ?? []).map((item) => [item.id, item.title]),
      );
      results.relations = (relations ?? [])
        .filter(
          (item) =>
            memoryIds.has(item.source_memory_id) ||
            memoryIds.has(item.target_memory_id),
        )
        .slice(0, 12)
        .map((item) => ({
          description: `${memoryTitles.get(item.source_memory_id) ?? "Memória relacionada"} → ${memoryTitles.get(item.target_memory_id) ?? "Memória relacionada"}`,
          id: item.id,
          meta: `${Math.round(item.weight * 100)}% força`,
          title: item.relation_type,
        }));
    }
    results.episodes = (episodes.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.summary ?? "Episódio sem resumo",
      meta: item.occurred_from
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "medium",
            timeZone: "America/Sao_Paulo",
          }).format(new Date(item.occurred_from))
        : "Data não informada",
    }));
    results.reflections = (reflections.data ?? []).map((item) => ({
      id: item.id,
      title: `Reflexão · versão ${item.version}`,
      description: item.content,
      meta: item.status,
    }));
    results.conflicts = (conflicts.data ?? []).map((item) => ({
      id: item.id,
      title: `${item.conflict_type} · ${item.severity}`,
      description: item.description,
      href: item.memory_dossier_id
        ? `/memory/dossiers/${item.memory_dossier_id}`
        : undefined,
      meta: item.status,
    }));
  }

  const total = Object.values(results).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-sm text-[#637083]"
        href="/memory"
      >
        <ArrowLeft size={16} /> Voltar à memória
      </Link>
      <header className="mt-5 rounded-[2rem] bg-[#17233e] p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d4ae67]">
          Explorador transversal
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Pesquisar todas as camadas
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-white/65">
          Encontre o mesmo tema em fontes, conceitos, afirmações, memórias,
          episódios, reflexões e divergências.
        </p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row" method="get">
          <label className="relative flex-1">
            <span className="sr-only">Tema da memória</span>
            <Search
              className="absolute left-4 top-3.5 text-[#637083]"
              size={18}
            />
            <input
              autoFocus
              className="min-h-12 w-full rounded-xl bg-white pl-11 pr-4 text-[#17233e]"
              defaultValue={query}
              minLength={2}
              name="q"
              placeholder="Ex.: permanência"
              required
            />
          </label>
          <Button
            className="min-h-12 bg-[#d4ae67] text-[#17233e] hover:bg-white"
            type="submit"
          >
            Pesquisar
          </Button>
        </form>
      </header>
      {query.length >= 2 ? (
        <p className="mt-6 text-sm text-[#637083]">
          {total} resultado(s) para{" "}
          <strong className="text-[#17233e]">“{query}”</strong>
        </p>
      ) : null}
      {query.length < 2 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-[#17233e]/20 p-8 text-center text-[#637083]">
          Digite um tema para atravessar todas as camadas da memória.
        </div>
      ) : total === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-[#17233e]/20 p-8 text-center">
          <h2 className="font-semibold">Nada encontrado</h2>
          <p className="mt-2 text-sm text-[#637083]">
            A ausência também é um resultado: ainda não há memória rastreável
            para este tema.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-9">
          {sections.map(([label, key, Icon]) =>
            results[key].length ? (
              <section key={key}>
                <div className="flex items-center gap-3">
                  <Icon className="text-[#a6751d]" size={20} />
                  <h2 className="text-xl font-semibold">{label}</h2>
                  <span className="text-xs text-[#637083]">
                    {results[key].length}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {results[key].map((item) => {
                    const card = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-6">
                            {item.title}
                          </h3>
                          {item.meta ? (
                            <span className="shrink-0 rounded-full bg-[#17233e]/5 px-2.5 py-1 text-xs text-[#637083]">
                              {item.meta}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#637083]">
                          {item.description}
                        </p>
                      </>
                    );
                    return item.href ? (
                      <Link
                        className="rounded-2xl border border-[#17233e]/10 bg-white p-5 transition hover:border-[#a6751d]/35"
                        href={item.href}
                        key={item.id}
                      >
                        {card}
                      </Link>
                    ) : (
                      <article
                        className="rounded-2xl border border-[#17233e]/10 bg-white p-5"
                        key={item.id}
                      >
                        {card}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileAudio,
  ScrollText,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const counts = workspace
    ? await Promise.all([
        supabase
          .from("sources")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        supabase
          .from("memories")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        supabase
          .from("audio_entries")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        supabase
          .from("reflections")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
      ])
    : [];

  const metrics = [
    { label: "Fontes", value: counts[0]?.count ?? 0, icon: BookOpen },
    { label: "Memórias", value: counts[1]?.count ?? 0, icon: Brain },
    { label: "Áudios", value: counts[2]?.count ?? 0, icon: FileAudio },
    { label: "Reflexões", value: counts[3]?.count ?? 0, icon: ScrollText },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a6751d]">
        Visão geral
      </p>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {workspace?.name ?? "Seu espaço reflexivo"}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#637083]">
            A fundação privada da memória está pronta. O conteúdo só será
            escrito depois de investigar as fontes e revisar as evidências.
          </p>
        </div>
        <Button asChild>
          <Link href="/reflection/new">
            Nova reflexão{" "}
            <ArrowRight aria-hidden="true" className="ml-2" size={17} />
          </Link>
        </Button>
      </div>

      <section
        aria-label="Resumo do acervo"
        className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ icon: Icon, label, value }) => (
          <article
            className="rounded-2xl border border-[#17233e]/10 bg-white p-5"
            key={label}
          >
            <Icon
              aria-hidden="true"
              className="text-[#536a5b]"
              size={22}
              strokeWidth={1.7}
            />
            <p className="mt-5 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-[#637083]">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[2rem] border border-[#17233e]/10 bg-white p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#536a5b]">
          Estado da fundação
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          Memória antes da escrita
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Biblioteca", "Fontes, versões, seções, chunks e resumos."],
            ["Investigação", "Retrieval, evidências, conflitos e dossiês."],
            ["Reflexão", "Transcrição, versões, aprovação e voz."],
          ].map(([title, description]) => (
            <div className="rounded-2xl bg-[#f5f0e5] p-5" key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#637083]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

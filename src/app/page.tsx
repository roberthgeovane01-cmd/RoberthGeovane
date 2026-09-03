import { ArrowRight, Database, LockKeyhole, Network } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.from("todos").select("id").limit(1);
  const connected = !error;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e5] px-6 py-8 text-[#17233e] sm:px-10 lg:px-16">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-40 [background-image:radial-gradient(#a6751d_0.7px,transparent_0.7px)] [background-size:24px_24px]"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-5">
          <Link className="font-semibold tracking-tight" href="/">
            Memória Reflexiva
          </Link>
          <Button asChild variant="secondary">
            <Link href="/login">Entrar</Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a6751d]">
              Memória antes da escrita
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              A reflexão começa investigando o que permanece.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#637083]">
              Uma biblioteca privada que transforma fontes, memórias e
              experiências revisadas em reflexões rastreáveis — sem fingir
              certeza e sem pular a investigação.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button asChild>
                <Link href="/login">
                  Abrir meu espaço
                  <ArrowRight aria-hidden="true" className="ml-2" size={17} />
                </Link>
              </Button>
              <span
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                  connected
                    ? "bg-[#536a5b]/10 text-[#405346]"
                    : "bg-[#8a3d32]/10 text-[#8a3d32]"
                }`}
                role="status"
              >
                <span
                  className={`size-2 rounded-full ${
                    connected ? "bg-[#536a5b]" : "bg-[#8a3d32]"
                  }`}
                />
                {connected ? "Supabase conectado" : "Supabase indisponível"}
              </span>
            </div>
          </div>

          <div className="relative rounded-[2.25rem] border border-[#17233e]/10 bg-white/90 p-7 shadow-[0_30px_100px_rgba(23,35,62,0.13)] backdrop-blur sm:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 size-36 rounded-full border border-[#a6751d]/25"
            />
            <p className="text-sm font-semibold">Fundação ativa</p>
            <div className="mt-6 space-y-4">
              {[
                [
                  Database,
                  "39 entidades de domínio",
                  "Schema versionado e preparado para rastreabilidade.",
                ],
                [
                  LockKeyhole,
                  "Isolamento por workspace",
                  "RLS e Storage privado desde a origem.",
                ],
                [
                  Network,
                  "Memória estruturada",
                  "Fontes, evidências, conflitos e versões separados.",
                ],
              ].map(([Icon, title, description]) => {
                const ItemIcon = Icon as typeof Database;
                return (
                  <div
                    className="flex gap-4 rounded-2xl bg-[#f5f0e5] p-5"
                    key={String(title)}
                  >
                    <ItemIcon
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#a6751d]"
                      size={22}
                      strokeWidth={1.7}
                    />
                    <div>
                      <h2 className="font-semibold">{String(title)}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#637083]">
                        {String(description)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

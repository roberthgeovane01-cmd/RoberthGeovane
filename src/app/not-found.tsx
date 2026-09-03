import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f0e5] px-6 text-[#17233e]">
      <section className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a6751d]">
          Página não encontrada
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Este caminho ainda não existe.
        </h1>
        <p className="mt-4 leading-7 text-[#637083]">
          Volte ao início para retomar sua memória reflexiva.
        </p>
        <Button asChild className="mt-7">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </section>
    </main>
  );
}

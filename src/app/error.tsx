"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f0e5] px-6 text-[#17233e]">
      <section className="max-w-lg rounded-[2rem] border border-[#17233e]/10 bg-white p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a3d32]">
          Erro interno
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          Não foi possível abrir esta etapa.
        </h1>
        <p className="mt-3 leading-7 text-[#637083]">
          Nenhum dado foi descartado. Tente carregar novamente.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}

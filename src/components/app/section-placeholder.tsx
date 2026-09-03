import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type SectionPlaceholderProps = {
  description: string;
  icon: LucideIcon;
  nextHref?: string;
  nextLabel?: string;
  phase: string;
  title: string;
};

export function SectionPlaceholder({
  description,
  icon: Icon,
  nextHref,
  nextLabel,
  phase,
  title,
}: SectionPlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a6751d]">
        {phase}
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#536a5b]/10 text-[#536a5b]">
          <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#637083]">
            {description}
          </p>
        </div>
      </div>

      <section className="mt-9 rounded-[2rem] border border-[#17233e]/10 bg-white p-7 shadow-[0_18px_60px_rgba(23,35,62,0.08)] sm:p-9">
        <span className="inline-flex rounded-full bg-[#a6751d]/10 px-3 py-1 text-xs font-semibold text-[#7b5718]">
          Fundação preparada
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          Próxima entrega desta área
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-[#637083]">
          A rota, o isolamento de dados e as entidades necessárias já existem. A
          experiência funcional será implementada na fase indicada, com testes
          de ponta a ponta antes da liberação.
        </p>
        {nextHref && nextLabel ? (
          <Button asChild className="mt-6">
            <Link href={nextHref}>{nextLabel}</Link>
          </Button>
        ) : null}
      </section>
    </div>
  );
}

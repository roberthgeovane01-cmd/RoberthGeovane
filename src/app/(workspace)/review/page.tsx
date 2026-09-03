import { SlidersHorizontal } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function ReviewPage() {
  return (
    <SectionPlaceholder
      description="Revise evidências, convergências, conflitos, inferências e decisões antes que o escritor receba o dossiê de memória."
      icon={SlidersHorizontal}
      nextHref="/history"
      nextLabel="Ver histórico"
      phase="Fase 9"
      title="Mesa editorial"
    />
  );
}

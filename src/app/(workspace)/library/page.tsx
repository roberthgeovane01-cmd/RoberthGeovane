import { Library } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function LibraryPage() {
  return (
    <SectionPlaceholder
      description="Organize livros, documentos e textos com versões, detecção de duplicidade, extração e rastreabilidade até a página original."
      icon={Library}
      nextHref="/memory"
      nextLabel="Ver fundação da memória"
      phase="Fase 2"
      title="Biblioteca"
    />
  );
}

import { AudioLines } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function NewReflectionPage() {
  return (
    <SectionPlaceholder
      description="O fluxo receberá a fala, exigirá revisão humana da transcrição e só liberará a escrita depois da investigação da memória."
      icon={AudioLines}
      nextHref="/review"
      nextLabel="Abrir mesa editorial"
      phase="Fases 8–10"
      title="Nova reflexão"
    />
  );
}

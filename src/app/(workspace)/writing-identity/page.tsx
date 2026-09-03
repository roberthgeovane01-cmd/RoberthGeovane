import { BookOpenText } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function WritingIdentityPage() {
  return (
    <SectionPlaceholder
      description="Defina regras de estilo, exemplos aprovados e versões da identidade literária sem misturar forma de escrita com fatos da memória."
      icon={BookOpenText}
      phase="Fase 11"
      title="Identidade de escrita"
    />
  );
}

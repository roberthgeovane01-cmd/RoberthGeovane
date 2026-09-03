import { History } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function HistoryPage() {
  return (
    <SectionPlaceholder
      description="Acompanhe sessões, versões, fontes utilizadas, decisões editoriais, aprovações e registros de auditoria."
      icon={History}
      phase="Fase 14"
      title="Histórico"
    />
  );
}

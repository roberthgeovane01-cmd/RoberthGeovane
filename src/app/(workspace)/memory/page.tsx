import { Brain } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function MemoryPage() {
  return (
    <SectionPlaceholder
      description="Consulte resumos, chunks, conceitos, afirmações, evidências e memórias canônicas sem reduzir o cérebro a um histórico de conversa."
      icon={Brain}
      nextHref="/reflection/new"
      nextLabel="Preparar nova reflexão"
      phase="Fases 3–7"
      title="Memória"
    />
  );
}

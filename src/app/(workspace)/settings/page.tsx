import { Settings } from "lucide-react";

import { SectionPlaceholder } from "@/components/app/section-placeholder";

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      description="Gerencie privacidade, consentimentos, retenção, provedores, voz, membros do workspace e exportação dos seus dados."
      icon={Settings}
      phase="Fase 15"
      title="Configurações"
    />
  );
}

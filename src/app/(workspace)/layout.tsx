import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { logout } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return (
    <AppShell
      logoutAction={logout}
      userEmail={
        typeof data.claims.email === "string" ? data.claims.email : undefined
      }
      workspaceName={workspace?.name ?? "Espaço pessoal"}
    >
      {children}
    </AppShell>
  );
}

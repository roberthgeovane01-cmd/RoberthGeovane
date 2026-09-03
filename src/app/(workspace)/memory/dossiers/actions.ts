"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { buildMemoryDossier } from "@/lib/dossiers/build";
import { createClient } from "@/utils/supabase/server";

async function context() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!workspace) throw new Error("workspace_missing");
  return { supabase, userId, workspaceId: workspace.id };
}

export async function createDossier(formData: FormData) {
  const parsed = z.uuid().safeParse(formData.get("sessionId"));
  if (!parsed.success) redirect("/memory/search?error=invalid_session");
  const { supabase, userId, workspaceId } = await context();
  let dossierId: string;
  try {
    dossierId = await buildMemoryDossier(supabase, {
      retrievalSessionId: parsed.data,
      userId,
      workspaceId,
    });
  } catch {
    redirect(`/memory/search?session=${parsed.data}&error=dossier_failed`);
  }
  redirect(`/memory/dossiers/${dossierId}`);
}

export async function approveDossier(formData: FormData) {
  const parsed = z.uuid().safeParse(formData.get("dossierId"));
  if (!parsed.success) redirect("/memory");
  const { supabase, userId } = await context();
  const { count } = await supabase
    .from("conflicts")
    .select("id", { count: "exact", head: true })
    .eq("memory_dossier_id", parsed.data)
    .eq("blocks_writing", true)
    .in("status", ["open", "review"]);
  if ((count ?? 0) > 0)
    redirect(`/memory/dossiers/${parsed.data}?error=conflicts_open`);
  await supabase
    .from("memory_dossiers")
    .update({
      approved_at: new Date().toISOString(),
      approved_by: userId,
      status: "approved",
    })
    .eq("id", parsed.data);
  redirect(`/memory/dossiers/${parsed.data}`);
}

export async function resolveConflict(formData: FormData) {
  const parsed = z
    .object({
      conflictId: z.uuid(),
      dossierId: z.uuid(),
      notes: z.string().trim().min(3).max(2_000),
      resolution: z.enum([
        "prefer_left",
        "prefer_right",
        "synthesize",
        "preserve_tension",
        "insufficient_evidence",
        "dismiss",
      ]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/memory");
  const { supabase, userId, workspaceId } = await context();
  await supabase.from("conflict_resolutions").insert({
    conflict_id: parsed.data.conflictId,
    created_by: userId,
    notes: parsed.data.notes,
    resolution_type: parsed.data.resolution,
    resolved_by: userId,
    workspace_id: workspaceId,
  });
  await supabase
    .from("conflicts")
    .update({ status: "resolved" })
    .eq("id", parsed.data.conflictId)
    .eq("memory_dossier_id", parsed.data.dossierId);
  redirect(`/memory/dossiers/${parsed.data.dossierId}`);
}

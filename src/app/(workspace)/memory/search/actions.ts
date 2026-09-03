"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { runMemoryRetrieval } from "@/lib/retrieval/search";
import { createClient } from "@/utils/supabase/server";

const searchSchema = z.object({
  author: z.string().trim().max(200).optional(),
  authority: z.coerce.number().int().min(1).max(5).optional(),
  query: z.string().trim().min(3).max(1_000),
  sourceType: z.enum([
    "",
    "book",
    "document",
    "article",
    "note",
    "web",
    "other",
  ]),
});

export async function searchMemory(formData: FormData) {
  const parsed = searchSchema.safeParse({
    author: formData.get("author") || undefined,
    authority: formData.get("authority") || undefined,
    query: formData.get("query"),
    sourceType: formData.get("sourceType") ?? "",
  });
  if (!parsed.success) redirect("/memory/search?error=invalid_query");

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/memory/search?error=no_workspace");

  let sessionId: string;
  try {
    sessionId = await runMemoryRetrieval(supabase, {
      filters: {
        author: parsed.data.author,
        authority: parsed.data.authority,
        sourceType: parsed.data.sourceType || undefined,
      },
      query: parsed.data.query,
      userId,
      workspaceId: workspace.id,
    });
  } catch {
    redirect("/memory/search?error=search_failed");
  }
  redirect(`/memory/search?session=${sessionId}`);
}

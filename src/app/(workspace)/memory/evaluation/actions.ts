"use server";
import { redirect } from "next/navigation";
import { runBrainProof } from "@/lib/evaluation/run";
import { createClient } from "@/utils/supabase/server";

export async function runEvaluation() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/memory/evaluation?error=workspace");
  const report = runBrainProof();
  const { error } = await supabase.from("retrieval_evaluations").insert({
    case_results: report.caseResults,
    created_by: userId,
    dataset_version: report.datasetVersion,
    metrics: report.metrics,
    name: "Prova do cérebro",
    parameters: { k: 5, corpus: "synthetic_isolated" },
    retrieval_version: report.retrievalVersion,
    workspace_id: workspace.id,
  });
  redirect(error ? "/memory/evaluation?error=save" : "/memory/evaluation");
}

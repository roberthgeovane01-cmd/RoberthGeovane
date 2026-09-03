import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/utils/supabase/env";

export type MemoryWorkflowInput = {
  accessToken: string;
  aiEnabled: boolean;
  jobId: string;
  revision: number;
  sourceId: string;
  userId: string;
  versionId: string;
  workspaceId: string;
};

export function createWorkflowClient(input: MemoryWorkflowInput) {
  const { publishableKey, url } = getSupabaseEnv();
  const serverKey = process.env.SUPABASE_SECRET_KEY?.trim();

  return createClient<Database>(url, serverKey || publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: serverKey
      ? undefined
      : { headers: { Authorization: `Bearer ${input.accessToken}` } },
  });
}

export async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value.normalize("NFC")),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function normalizedConceptName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

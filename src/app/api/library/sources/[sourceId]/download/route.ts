import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { sourceId } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: version } = await supabase
    .from("source_versions")
    .select("original_filename, storage_path")
    .eq("source_id", sourceId)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("library-originals")
    .createSignedUrl(version.storage_path, 60, {
      download: version.original_filename,
    });

  if (error || !data) {
    return NextResponse.json(
      { error: "download_unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}

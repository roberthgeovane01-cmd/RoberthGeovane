import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ audioId: string }> },
) {
  const { audioId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { data: audio } = await supabase
    .from("audio_entries")
    .select("storage_path")
    .eq("id", audioId)
    .maybeSingle();
  if (!audio) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const signed = await supabase.storage
    .from("audio-originals")
    .createSignedUrl(audio.storage_path, 60);
  if (signed.error || !signed.data) {
    return NextResponse.json({ error: "audio_unavailable" }, { status: 503 });
  }
  return NextResponse.redirect(signed.data.signedUrl, 302);
}

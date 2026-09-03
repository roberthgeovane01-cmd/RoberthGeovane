import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("todos").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { database: "unavailable", status: "degraded" },
      { status: 503 },
    );
  }

  return NextResponse.json({ database: "connected", status: "ok" });
}

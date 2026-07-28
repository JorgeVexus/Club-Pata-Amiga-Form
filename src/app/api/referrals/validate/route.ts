import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ valid: false });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ambassadors")
    .select("id")
    .eq("referral_code", code)
    .eq("status", "approved")
    .maybeSingle();

  return NextResponse.json({ valid: Boolean(data) });
}

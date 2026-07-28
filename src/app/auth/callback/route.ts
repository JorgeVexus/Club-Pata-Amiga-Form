import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginDestination } from "@/lib/login-destination";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sin ?next explícito, el rol y estado deciden el destino:
      // admin → /admin · miembro con plan → /app · embajador sin plan → /embajador
      if (!searchParams.get("next")) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const dest = await loginDestination(user);
          return NextResponse.redirect(`${origin}${dest}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/iniciar-sesion?error=auth`);
}

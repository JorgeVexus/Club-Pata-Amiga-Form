import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Áreas que exigen sesión. Se comparan por SEGMENTO EXACTO (ver más abajo),
 * no con `startsWith` pelón: `/embajadores` y `/centros` son landings
 * públicas y empiezan igual que `/embajador` y `/centro`, que sí son
 * privadas. Con `startsWith` la landing pública quedaba detrás del login.
 *
 * `/ventas` y `/centro` además se validan en el servidor (`requirePortal` y
 * el `getUser` de `centro/page.tsx`); tenerlas aquí corta antes a quien no
 * trae sesión, sin llegar a la base.
 */
const AREAS_PRIVADAS = [
  "/app",
  "/admin",
  "/embajador",
  "/ventas",
  "/centro",
];

/** Refreshes the auth session on every request and guards protected areas. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = AREAS_PRIVADAS.some(
    (area) => path === area || path.startsWith(`${area}/`),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplatedEmail } from "@/lib/email/send";

/**
 * Cron diario de felicitaciones de cumpleaños (miembros y mascotas).
 * Se ejecuta una vez al día; envía el correo brandeado a quien cumple años hoy.
 *
 * CONECTAR: programar en Vercel (vercel.json → crons) apuntando a
 * /api/cron/cumpleanos con un CRON_SECRET. Ver docs.
 *
 * Protección: requiere el header "authorization: Bearer <CRON_SECRET>" o
 * ?secret=<CRON_SECRET>. Si no hay CRON_SECRET configurado, se rechaza salvo
 * que venga del propio cron de Vercel (header x-vercel-cron).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;
  if (secret) {
    if (provided !== secret && !isVercelCron) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else if (!isVercelCron) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const todayMMDD = `${mm}-${dd}`;
  const thisYear = now.getUTCFullYear();

  let memberMatches = 0;
  let memberEmails = 0;
  let petMatches = 0;
  let petEmails = 0;

  // ===== Miembros que cumplen años hoy =====
  // Filtramos por mes/día en memoria: son pocos registros y birth_date es date.
  const { data: profiles } = await admin
    .from("profiles")
    .select("email, first_name, birth_date, membership_status, member_since")
    .not("birth_date", "is", null);

  for (const pr of profiles ?? []) {
    if (!pr.birth_date || !pr.email) continue;
    // Solo miembros (con membresía o alta como miembro) — no prospectos sueltos
    const isMember = pr.membership_status === "active" || Boolean(pr.member_since);
    if (!isMember) continue;
    if (String(pr.birth_date).slice(5, 10) !== todayMMDD) continue;
    memberMatches++;
    const ok = await sendTemplatedEmail("birthday_member", pr.email, {
      firstName: pr.first_name ?? "",
    });
    if (ok) memberEmails++;
  }

  // ===== Mascotas que cumplen años hoy =====
  const { data: pets } = await admin
    .from("pets")
    .select(
      "name, species, birth_date, is_active, is_deceased, profiles!user_id(email, first_name)",
    )
    .eq("is_active", true)
    .eq("is_deceased", false)
    .not("birth_date", "is", null);

  for (const pet of pets ?? []) {
    if (!pet.birth_date) continue;
    if (String(pet.birth_date).slice(5, 10) !== todayMMDD) continue;
    petMatches++;
    // El embed profiles!user_id llega como objeto (FK única user_id → profiles)
    const owner = pet.profiles as unknown as {
      email: string | null;
      first_name: string | null;
    } | null;
    if (!owner?.email) continue;

    const birthYear = Number(String(pet.birth_date).slice(0, 4));
    const age = thisYear - birthYear;
    const ageLine =
      Number.isFinite(age) && age > 0
        ? `¡Hoy cumple ${age} ${age === 1 ? "año" : "años"}!`
        : "";
    const ok = await sendTemplatedEmail("birthday_pet", owner.email, {
      firstName: owner.first_name ?? "",
      petName: pet.name,
      petEmoji: pet.species === "dog" ? "🐶" : "🐱",
      ageLine,
    });
    if (ok) petEmails++;
  }

  return NextResponse.json({
    date: `${thisYear}-${todayMMDD}`,
    memberMatches,
    memberEmails,
    petMatches,
    petEmails,
  });
}

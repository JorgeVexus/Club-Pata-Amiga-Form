import { NextResponse } from "next/server";

/**
 * CP lookup → state, city, colonias. Tries the Sepomex mirror first (has
 * municipio + full colonia list), then zippopotam (colonias + state only).
 * The form degrades to manual entry when both are down. TODO: import the
 * Sepomex catalog into our own table before launch.
 */

async function fromSepomexMirror(cp: string) {
  const res = await fetch(
    `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`,
    { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) },
  );
  if (!res.ok) throw new Error(`sepomex ${res.status}`);
  const data = await res.json();
  const rows: { d_estado: string; d_mnpio: string; d_asenta: string }[] =
    data.zip_codes ?? [];
  if (!rows.length) return null;
  return {
    found: true,
    state: rows[0].d_estado,
    city: rows[0].d_mnpio,
    colonies: rows.map((r) => r.d_asenta),
  };
}

async function fromZippopotam(cp: string) {
  const res = await fetch(`https://api.zippopotam.us/mx/${cp}`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`zippopotam ${res.status}`);
  const data = await res.json();
  const places: { "place name": string; state: string }[] = data.places ?? [];
  if (!places.length) return null;
  return {
    found: true,
    state: places[0].state,
    city: "",
    colonies: places.map((p) => p["place name"]),
  };
}

export async function GET(request: Request) {
  const cp = new URL(request.url).searchParams.get("cp");
  if (!cp || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ error: "CP inválido" }, { status: 400 });
  }

  for (const source of [fromSepomexMirror, fromZippopotam]) {
    try {
      const result = await source(cp);
      if (result) return NextResponse.json(result);
    } catch {
      // try the next source
    }
  }
  return NextResponse.json({ found: false, degraded: true });
}

import { createAdminClient } from "@/lib/supabase/admin";
import {
  MATERIAL_SLOTS,
  NOTIFY_EVENTS,
  SITE_ASSET_SLOTS,
  SITE_SETTINGS,
} from "@/lib/site";
import { updateSiteAsset, updateSiteSettings } from "@/app/admin/actions";
import { formatDateEs } from "@/lib/dates";

/* eslint-disable @next/next/no-img-element -- previews of uploaded assets */

export default async function AdminSitioPage() {
  const admin = createAdminClient();
  const [{ data: assets }, { data: settings }, { count: subscribers }] =
    await Promise.all([
      admin.from("site_assets").select("slot, url, updated_at"),
      admin.from("site_settings").select("key, value"),
      admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true }),
    ]);
  const bySlot = Object.fromEntries((assets ?? []).map((a) => [a.slot, a]));
  const settingOverrides = Object.fromEntries(
    (settings ?? []).filter((s) => s.value).map((s) => [s.key, s.value]),
  );

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <h1 className="font-display text-[26px] text-ink-title">Sitio web</h1>
      <p className="-mt-2 max-w-[560px] text-sm text-ink-secondary">
        Fotos de la landing pública. Al subir una imagen se publica al
        instante — sin necesidad de tocar el código.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {SITE_ASSET_SLOTS.map((s) => {
          const current = bySlot[s.slot];
          return (
            <div
              key={s.slot}
              className="flex flex-col gap-3 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink-title">
                  {s.label}
                </span>
                <span className="text-xs text-ink-tertiary">{s.hint}</span>
              </div>
              {current ? (
                <img
                  src={current.url}
                  alt={s.label}
                  className="h-[140px] w-full rounded-[12px] object-cover"
                />
              ) : (
                <div className="grid h-[140px] place-items-center rounded-[12px] border-2 border-dashed border-border-input text-xs font-semibold text-ink-placeholder">
                  Sin imagen — se muestra el bloque punteado
                </div>
              )}
              {current && (
                <span className="text-[11px] text-ink-tertiary">
                  Actualizada el {formatDateEs(new Date(current.updated_at))}
                </span>
              )}
              <form action={updateSiteAsset} className="flex flex-col gap-2">
                <input type="hidden" name="slot" value={s.slot} />
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="text-xs text-ink-secondary file:mr-2 file:rounded-full file:border-0 file:bg-info-bg file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-info-text"
                />
                <button
                  type="submit"
                  className="grid h-9 place-items-center rounded-full bg-teal px-4 text-xs font-bold text-white transition-colors hover:bg-teal-deep"
                >
                  {current ? "Reemplazar imagen" : "Subir imagen"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-lg text-ink-title">
        Materiales de embajador
      </h2>
      <p className="-mt-3 max-w-[560px] text-sm text-ink-secondary">
        Archivos descargables del portal de embajadores (ZIP, PDF, video…).
        Se pueden rotar en cualquier momento; el slot de campaña es para el
        asset de temporada.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MATERIAL_SLOTS.map((m) => {
          const current = bySlot[m.slot];
          return (
            <div
              key={m.slot}
              className="flex flex-col gap-2.5 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {m.emoji}
                </span>
                <span className="text-sm font-bold text-ink-title">
                  {m.label}
                </span>
              </div>
              <span className="text-xs text-ink-tertiary">{m.hint}</span>
              {current ? (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-teal-deep hover:underline"
                >
                  Ver archivo actual → (subido el{" "}
                  {formatDateEs(new Date(current.updated_at))})
                </a>
              ) : (
                <span className="text-xs font-semibold text-ink-placeholder">
                  Sin archivo — el portal muestra «MUY PRONTO»
                </span>
              )}
              <form action={updateSiteAsset} className="mt-auto flex flex-col gap-2">
                <input type="hidden" name="slot" value={m.slot} />
                <input
                  type="file"
                  name="file"
                  required
                  className="text-xs text-ink-secondary file:mr-2 file:rounded-full file:border-0 file:bg-info-bg file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-info-text"
                />
                <button
                  type="submit"
                  className="grid h-9 place-items-center rounded-full bg-teal px-4 text-xs font-bold text-white transition-colors hover:bg-teal-deep"
                >
                  {current ? "Reemplazar" : "Subir"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-lg text-ink-title">
        Notificaciones del equipo
      </h2>
      <p className="-mt-3 max-w-[620px] text-sm text-ink-secondary">
        Quién recibe cada aviso por correo. Escribe uno o varios correos
        separados por coma; deja vacío para desactivar ese aviso.
      </p>
      <form
        action={updateSiteSettings}
        className="flex max-w-[620px] flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
      >
        {NOTIFY_EVENTS.map((n) => (
          <label key={n.key} className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-ink-title">
              {n.label}
            </span>
            <span className="text-xs text-ink-tertiary">{n.hint}</span>
            <input
              name={n.key}
              defaultValue={settingOverrides[n.key] ?? ""}
              placeholder="correo@pataamiga.mx, otro@pataamiga.mx"
              className="mt-1 h-11 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm text-ink-title outline-none focus:border-teal"
            />
          </label>
        ))}
        <button
          type="submit"
          className="grid h-10 place-items-center self-start rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
        >
          Guardar notificaciones
        </button>
      </form>

      <h2 className="font-display text-lg text-ink-title">Redes y contacto</h2>
      <form
        action={updateSiteSettings}
        className="flex max-w-[560px] flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
      >
        {SITE_SETTINGS.map((s) => (
          <label key={s.key} className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-title">
              {s.label}
            </span>
            <input
              name={s.key}
              defaultValue={settingOverrides[s.key] ?? s.default}
              className="h-11 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm text-ink-title outline-none focus:border-teal"
            />
          </label>
        ))}
        <button
          type="submit"
          className="grid h-10 place-items-center self-start rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
        >
          Guardar ajustes
        </button>
      </form>

      {/* El conocimiento de los agentes IA se administra en /admin/conversaciones */}
      <div className="flex items-center justify-between rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ink-title">
            Suscriptores del newsletter
          </span>
          <span className="text-xs text-ink-tertiary">
            Altas desde el footer de la landing.
          </span>
        </div>
        <span className="font-display text-[26px] text-ink-title">
          {subscribers ?? 0}
        </span>
      </div>
    </div>
  );
}

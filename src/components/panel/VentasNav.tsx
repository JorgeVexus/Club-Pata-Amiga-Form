"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Menú del portal de ventas. Los apartados que todavía no existen se muestran
 * apagados con la fase en que llegan, en lugar de enlazar a páginas vacías:
 * el equipo ve el mapa completo sin toparse con pantallas muertas.
 *
 * El acento activo es naranja (el panel de administración usa teal) para que
 * siempre se sepa en qué portal se está trabajando.
 */
const ITEMS: {
  href: string;
  icon: string;
  label: string;
  soon?: string;
}[] = [
  { href: "/ventas", icon: "📊", label: "Resumen" },
  { href: "/ventas/contactos", icon: "👤", label: "Contactos" },
  { href: "/ventas/pipelines", icon: "🎯", label: "Pipelines" },
  { href: "/ventas/conversaciones", icon: "📨", label: "Conversaciones" },
  { href: "/ventas/plantillas", icon: "📄", label: "Plantillas" },
  { href: "/ventas/ia", icon: "✨", label: "Agentes IA" },
  { href: "/ventas/membresias", icon: "💳", label: "Membresías" },
  { href: "/ventas/calendario", icon: "🗓️", label: "Calendario" },
  { href: "/ventas/newsletter", icon: "📰", label: "Boletín" },
];

function itemClasses(active: boolean) {
  return `flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[13.5px] ${
    active
      ? "bg-orange/25 font-bold text-white"
      : "font-semibold text-white/75 hover:bg-white/[.06]"
  }`;
}

export function VentasNav() {
  const pathname = usePathname();

  return (
    <>
      {ITEMS.map((item) => {
        if (item.soon) {
          return (
            <span
              key={item.href}
              aria-disabled
              title={`Llega en la fase ${item.soon}`}
              className="flex cursor-default items-center justify-between rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-white/35"
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white/50">
                {item.soon}
              </span>
            </span>
          );
        }
        const active =
          item.href === "/ventas"
            ? pathname === "/ventas"
            : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={itemClasses(active)}>
            <span className="flex items-center gap-2.5">
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

/** Versión móvil: chips horizontales con scroll bajo la barra superior. */
export function VentasNavMobile() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 [-webkit-overflow-scrolling:touch]">
      {ITEMS.map((item) => {
        if (item.soon) {
          return (
            <span
              key={item.href}
              aria-disabled
              className="flex flex-none items-center gap-1.5 rounded-full bg-white/[.04] px-3.5 py-2 text-[12px] font-semibold text-white/35"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              <span className="text-[9.5px] font-extrabold text-white/40">
                {item.soon}
              </span>
            </span>
          );
        }
        const active =
          item.href === "/ventas"
            ? pathname === "/ventas"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] ${
              active
                ? "bg-orange/30 font-bold text-white"
                : "bg-white/[.06] font-semibold text-white/75"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

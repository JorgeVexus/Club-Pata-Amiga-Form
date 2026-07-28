"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/app", icon: "🏠", label: "Inicio", short: "Inicio" },
  { href: "/app/peludos", icon: "🐾", label: "Mis peludos", short: "Peludos" },
  { href: "/app/reintegros", icon: "💚", label: "Reintegros", short: "Reintegros" },
  { href: "/app/vet", icon: "💬", label: "Orientación vet 24/7", short: "Vet 24/7" },
  { href: "/app/centros", icon: "📍", label: "Centros aliados", short: "Centros" },
] as const;

// Miembro que además es embajador o centro aliado aprobado ve el acceso a su otro panel
const AMBASSADOR_ITEM = {
  href: "/embajador",
  icon: "🤝",
  label: "Panel de embajador",
  short: "Embajador",
} as const;

const CENTER_ITEM = {
  href: "/centro",
  icon: "🏪",
  label: "Mi centro aliado",
  short: "Mi centro",
} as const;

type NavItem =
  | (typeof NAV_ITEMS)[number]
  | typeof AMBASSADOR_ITEM
  | typeof CENTER_ITEM;

function navItems(ambassador: boolean, center: boolean): readonly NavItem[] {
  return [
    ...NAV_ITEMS,
    ...(ambassador ? [AMBASSADOR_ITEM] : []),
    ...(center ? [CENTER_ITEM] : []),
  ];
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

/** Desktop sidebar links (screen 3a). */
export function SidebarLinks({
  ambassador = false,
  center = false,
}: {
  ambassador?: boolean;
  center?: boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      {navItems(ambassador, center).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            isActive(pathname, item.href)
              ? "flex items-center gap-3 rounded-[12px] bg-info-bg px-3.5 py-[11px] text-sm font-bold text-teal-deep"
              : "flex items-center gap-3 rounded-[12px] px-3.5 py-[11px] text-sm font-semibold text-[#5B6B68] transition-colors hover:bg-cream"
          }
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </>
  );
}

/** Mobile bottom tab bar (screen 3b). */
export function TabBar({
  ambassador = false,
  center = false,
}: {
  ambassador?: boolean;
  center?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border-divider bg-white px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 md:hidden">
      {navItems(ambassador, center).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-[3px] text-[10px] ${
            isActive(pathname, item.href)
              ? "font-bold text-teal-deep"
              : "font-semibold text-ink-tertiary"
          }`}
        >
          <span className="text-[19px]" aria-hidden>
            {item.icon}
          </span>
          {item.short}
        </Link>
      ))}
    </nav>
  );
}

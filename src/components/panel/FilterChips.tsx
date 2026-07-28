import Link from "next/link";

/**
 * Filtros por estado para las listas grandes del panel (nota del cliente
 * 16-jul): chips que filtran vía querystring, sin JS de cliente.
 */
export function FilterChips({
  basePath,
  current,
  options,
  allLabel = "Todas",
}: {
  basePath: string;
  current?: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const chip = (active: boolean) =>
    active
      ? "rounded-full bg-teal px-4 py-[7px] text-xs font-bold text-white"
      : "rounded-full border-[1.5px] border-border-input bg-white px-4 py-[7px] text-xs font-semibold text-ink-secondary transition-colors hover:border-teal";
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={basePath} className={chip(!current)}>
        {allLabel}
      </Link>
      {options.map((o) => (
        <Link
          key={o.value}
          href={`${basePath}?estado=${o.value}`}
          className={chip(current === o.value)}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

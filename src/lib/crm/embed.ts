/**
 * PostgREST devuelve las relaciones embebidas como arreglo aunque la relación
 * sea de uno a uno (`contact_tags(tags(...))` llega como `tags: [...]`).
 *
 * Esta función normaliza eso en un solo lugar, en vez de sembrar castings por
 * todas las páginas. Es el mismo patrón que ya usa `admin/actions.ts`.
 */
export function uno<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Varios embebidos, ya sin nulos. */
export function varios<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value.filter((v): v is T => v != null);
  return value == null ? [] : [value];
}

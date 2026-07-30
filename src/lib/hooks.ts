"use client";

import { useCallback, useSyncExternalStore } from "react";

const MINUTO_MS = 60_000;

/**
 * Hooks de cliente compartidos.
 *
 * Los dos que viven aquí resuelven el mismo problema de fondo: leer algo que
 * SOLO existe en el navegador (el reloj, `localStorage`) sin romper las reglas
 * que el React Compiler necesita para poder optimizar. La respuesta de React
 * para eso es `useSyncExternalStore`, no `useEffect` + `setState`.
 */

// --- Reloj ---------------------------------------------------------------

/** Redondeado al minuto A PROPÓSITO: `useSyncExternalStore` exige que la
 *  lectura devuelva el MISMO valor mientras nada cambie. Con `Date.now()` en
 *  crudo cambiaría en cada llamada y React re-renderizaría sin parar. */
const minutoActual = () => Math.floor(Date.now() / MINUTO_MS) * MINUTO_MS;

/** En el servidor no hay reloj que empate con el del navegador; devolvemos un
 *  valor fijo y React vuelve a renderizar con la hora buena al hidratar. */
const sinReloj = () => 0;

function cadaMinuto(alCambiar: () => void) {
  const id = setInterval(alCambiar, MINUTO_MS);
  return () => clearInterval(id);
}

/**
 * La hora actual para pintar tiempos relativos ("hace 5 min"), que se
 * refresca sola cada minuto.
 *
 * Se usa junto con `tiempoRelativo` / `estaVencida` de `@/lib/dates`, que
 * reciben `ahora` en vez de leerlo: llamar `Date.now()` dentro del render deja
 * la hora congelada entre re-renders y puede desajustar la hidratación.
 */
export function useAhora(): number {
  return useSyncExternalStore(cadaMinuto, minutoActual, sinReloj);
}

// --- localStorage --------------------------------------------------------

/**
 * Lee una llave de `localStorage` (solo lectura) sin `setState` dentro de un
 * efecto. En el servidor vale `null`, y al hidratar React vuelve a renderizar
 * con el valor real.
 *
 * Para ESCRIBIR, guarda con `window.localStorage.setItem` en el manejador del
 * evento y lleva aparte el valor nuevo en un `useState`: el evento `storage`
 * solo avisa de cambios hechos en OTRA pestaña, nunca de los propios.
 */
export function useValorLocal(llave: string): string | null {
  const leer = useCallback(() => window.localStorage.getItem(llave), [llave]);
  return useSyncExternalStore(suscribirAStorage, leer, () => null);
}

function suscribirAStorage(alCambiar: () => void) {
  window.addEventListener("storage", alCambiar);
  return () => window.removeEventListener("storage", alCambiar);
}

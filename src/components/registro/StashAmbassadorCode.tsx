"use client";

import { useEffect } from "react";

/**
 * Los links de embajador llegan a /registro?codigo=… pero el pago está dos
 * pasos después — guarda el código para que el plan lo aplique solo.
 */
export function StashAmbassadorCode() {
  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get("codigo");
    if (codigo?.trim())
      window.localStorage.setItem("pa_ambassador_code", codigo.trim());
  }, []);
  return null;
}

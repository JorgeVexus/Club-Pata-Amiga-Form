/**
 * COSTO DE LAS CORRIDAS DE IA — sección 5, punto 3.3.
 *
 * Vive aparte y sin dependencias a propósito: es aritmética, se puede probar
 * sola, y la van a querer reusar los otros agentes el día que también lleven
 * cuenta (hoy solo estiman tokens por longitud de texto).
 *
 * Los precios son los DECLARADOS en Ajustes de IA, no lo que factura el
 * proveedor. Si cambia la lista de precios hay que actualizarlos; por eso son
 * un ajuste editable y no una constante escondida en el código.
 */

export type Precios = {
  entradaUsdMillon: number;
  salidaUsdMillon: number;
  tipoCambio: number;
};

export const PRECIOS_POR_OMISION: Precios = {
  entradaUsdMillon: 5,
  salidaUsdMillon: 25,
  tipoCambio: 20,
};

/** Lee los precios de los ajustes, cayendo a los por omisión si algo no es número. */
export function preciosDe(ajustes: Record<string, string>): Precios {
  const num = (llave: string, porOmision: number) => {
    const v = Number(ajustes[llave]);
    return Number.isFinite(v) && v >= 0 ? v : porOmision;
  };
  return {
    entradaUsdMillon: num("ia_precio_entrada_usd_millon", PRECIOS_POR_OMISION.entradaUsdMillon),
    salidaUsdMillon: num("ia_precio_salida_usd_millon", PRECIOS_POR_OMISION.salidaUsdMillon),
    tipoCambio: num("ia_tipo_cambio_mxn", PRECIOS_POR_OMISION.tipoCambio),
  };
}

/** Costo de una corrida, en centavos de peso. */
export function costoEnCentavos(
  tokensIn: number,
  tokensOut: number,
  p: Precios = PRECIOS_POR_OMISION,
): number {
  const entrada = Math.max(0, tokensIn) / 1_000_000;
  const salida = Math.max(0, tokensOut) / 1_000_000;
  const usd = entrada * p.entradaUsdMillon + salida * p.salidaUsdMillon;
  return Math.round(usd * p.tipoCambio * 100);
}

/** Suma de centavos a pesos con dos decimales, para mostrar. */
export function enPesos(centavos: number): string {
  return `$${(centavos / 100).toFixed(2)}`;
}

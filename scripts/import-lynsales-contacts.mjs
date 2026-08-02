/**
 * Importa el export de LynSales (995 filas) al CRM de ventas en STAGING,
 * usando exactamente la misma logica que el importador del navegador
 * (src/lib/crm/import.ts) - misma deteccion de duplicados, mismo mapeo de
 * pipeline por etiquetas, mismos lotes de 50.
 *
 * Uso:
 *   npx tsx scripts/import-lynsales-contacts.mjs --preview   (solo analiza)
 *   npx tsx scripts/import-lynsales-contacts.mjs --apply     (escribe de verdad)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import {
  leerCsv,
  adivinarMapeo,
  aplicarMapeo,
  analizar,
  importar,
} from "../src/lib/crm/import.ts";

const CSV_PATH = "C:/Users/Jorge Cerna/Downloads/Export_Contacts_undefined_Jul_2026_12_16_PM.csv";
// ACTOR_ID debe ser un profile.id que exista en el proyecto destino (falla
// silenciosamente el registro de actividad si no, sin tumbar el import de
// contactos). Pasar via env ACTOR_ID en vez de hardcodear un proyecto.
const ACTOR_ID = process.env.ACTOR_ID || "a6d8e388-5fa4-43a8-8e0d-da41bb941215";
const APPLY = process.argv.includes("--apply");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const texto = readFileSync(CSV_PATH, "utf-8");
const filas = leerCsv(texto);
const [cabeceras, ...datos] = filas;
const mapeo = adivinarMapeo(cabeceras);
console.log("Cabeceras:", cabeceras);
console.log("Mapeo adivinado:", mapeo);
console.log(`Total filas de datos: ${datos.length}`);

const filasMapeadas = aplicarMapeo(datos, mapeo);

const analisis = await analizar(admin, filasMapeadas);
console.log("--- Vista previa ---");
console.log(analisis.conteo ?? analisis);

if (!APPLY) {
  console.log("Preview solamente - usa --apply para escribir de verdad.");
  process.exit(0);
}

const fromArg = process.argv.find((a) => a.startsWith("--from="));
console.log("--- Importando en lotes de 50 ---");
let desde = fromArg ? Number(fromArg.split("=")[1]) : 0;
console.log(`Empezando desde la fila ${desde}`);
const TAMANO_LOTE = 50;
let totalCreados = 0, totalUnidos = 0, totalOmitidos = 0, totalRevisar = 0;
while (desde < filasMapeadas.length) {
  const lote = filasMapeadas.slice(desde, desde + TAMANO_LOTE);
  const resultado = await importar(admin, lote, ACTOR_ID, "LynSales export (Jul 2026)", {
    colocarEnPipeline: true,
  });
  totalCreados += resultado.creados;
  totalUnidos += resultado.unidos;
  totalOmitidos += resultado.omitidos;
  totalRevisar += resultado.paraRevisar;
  desde += lote.length;
  console.log(`  ${desde}/${filasMapeadas.length} — creados:${resultado.creados} unidos:${resultado.unidos} omitidos:${resultado.omitidos}`);
  if (resultado.errores?.length) console.error("  errores:", resultado.errores);
}
console.log("--- Resumen final ---");
console.log({ totalCreados, totalUnidos, totalOmitidos, totalRevisar });

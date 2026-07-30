import { publicadorDe, type Plataforma } from "@/lib/content/registry";
import {
  revisarReclamosDeSalud,
  revisarTerminologia,
} from "@/lib/content/terminologia";

/**
 * LAS CUATRO REVISIONES antes de que algo pueda programarse — sección 4,
 * punto 4.
 *
 *   1. Límites del canal      → saltable por super admin
 *   2. Terminología vinculante → NO SALTABLE POR NADIE
 *   3. Reclamos de salud       → saltable por super admin, con constancia
 *   4. Activos presentes       → saltable por super admin, con constancia
 *
 * La 2 es la única sin escape, y es a propósito: un post que dice "seguro" es
 * un problema legal, no un detalle de estilo. Por eso `puedeProgramarse()` la
 * mira aparte y ni siquiera acepta un parámetro para ignorarla — no hay forma
 * de pedirle que la salte, ni por error.
 */

export type Severidad = "bloqueante" | "saltable";

export type Problema = {
  severidad: Severidad;
  /** Para agrupar y para la constancia de quien salta. */
  clase: "terminologia" | "limites" | "salud" | "activos";
  mensaje: string;
  /** El canal al que aplica, si es de límites. */
  canal?: string;
};

export type EntradaValidacion = {
  titulo: string;
  texto: string;
  activos: string[];
  /** Plataformas destino elegidas. */
  plataformas: string[];
};

/** Extensión de un archivo, en minúsculas y sin punto. */
function extensionDe(ruta: string) {
  const limpia = ruta.split("?")[0];
  const punto = limpia.lastIndexOf(".");
  return punto === -1 ? "" : limpia.slice(punto + 1).toLowerCase();
}

export function validarContenido(entrada: EntradaValidacion): Problema[] {
  const problemas: Problema[] = [];

  // --- 2. Terminología vinculante (primero: es la que manda) ---------------
  for (const h of revisarTerminologia(`${entrada.titulo}\n${entrada.texto}`))
    problemas.push({
      severidad: "bloqueante",
      clase: "terminologia",
      mensaje: `"${h.encontrado}" no se puede publicar. Di "${h.enLugarDe}".`,
    });

  // --- 1. Límites de cada canal -------------------------------------------
  for (const plataforma of entrada.plataformas) {
    const pub = publicadorDe(plataforma);
    if (!pub) {
      problemas.push({
        severidad: "saltable",
        clase: "limites",
        canal: plataforma,
        mensaje: `No hay publicador para "${plataforma}".`,
      });
      continue;
    }
    const { limites, etiqueta } = pub;

    if (limites.textoMax > 0 && entrada.texto.length > limites.textoMax)
      problemas.push({
        severidad: "saltable",
        clase: "limites",
        canal: etiqueta,
        mensaje: `El copy tiene ${entrada.texto.length} caracteres y ${etiqueta} acepta ${limites.textoMax}.`,
      });

    const imagenes = entrada.activos.filter((a) =>
      ["jpg", "jpeg", "png", "webp"].includes(extensionDe(a)),
    );
    if (imagenes.length > limites.imagenesMax)
      problemas.push({
        severidad: "saltable",
        clase: "limites",
        canal: etiqueta,
        mensaje:
          limites.imagenesMax === 0
            ? `${etiqueta} no acepta imágenes sueltas (va video).`
            : `${imagenes.length} imágenes para ${etiqueta}, que acepta ${limites.imagenesMax}.`,
      });

    for (const activo of entrada.activos) {
      const ext = extensionDe(activo);
      if (ext && !limites.formatos.includes(ext))
        problemas.push({
          severidad: "saltable",
          clase: "limites",
          canal: etiqueta,
          mensaje: `${etiqueta} no acepta archivos .${ext}.`,
        });
    }

    // --- 4. Activos presentes ---------------------------------------------
    // Un post programado sin su imagen no llega a la hora de publicar y se
    // descubre tarde. Se detecta aquí, cuando todavía hay tiempo.
    if (limites.exigeActivo && entrada.activos.length === 0)
      problemas.push({
        severidad: "saltable",
        clase: "activos",
        canal: etiqueta,
        mensaje: `${etiqueta} no publica sin imagen o video.`,
      });
  }

  // --- 3. Reclamos de salud ------------------------------------------------
  for (const aviso of revisarReclamosDeSalud(`${entrada.titulo}\n${entrada.texto}`))
    problemas.push({ severidad: "saltable", clase: "salud", mensaje: aviso });

  return problemas;
}

/**
 * ¿Se puede programar?
 *
 * `saltarClases` son las clases que un super admin decidió pasar por alto
 * dejando constancia. Fíjate en que "terminologia" NO se lee de ahí: aunque
 * alguien la mande, se ignora. No hay manera de pedir que se salte.
 */
export function puedeProgramarse(
  problemas: Problema[],
  saltarClases: string[] = [],
): { ok: boolean; pendientes: Problema[] } {
  const pendientes = problemas.filter((p) => {
    if (p.clase === "terminologia") return true; // nunca se perdona
    if (p.severidad !== "bloqueante" && saltarClases.includes(p.clase)) return false;
    return true;
  });
  return { ok: pendientes.length === 0, pendientes };
}

/** Las clases que un super admin sí puede saltar, para armar la interfaz. */
export const CLASES_SALTABLES = ["limites", "salud", "activos"] as const;

/** Cuántos caracteres le sobran (o faltan) al copy en cada plataforma. */
export function conteoPorPlataforma(
  texto: string,
  plataformas: string[],
): { plataforma: Plataforma; etiqueta: string; usados: number; max: number }[] {
  const salida = [];
  for (const p of plataformas) {
    const pub = publicadorDe(p);
    if (!pub || pub.limites.textoMax === 0) continue;
    salida.push({
      plataforma: pub.plataforma,
      etiqueta: pub.etiqueta,
      usados: texto.length,
      max: pub.limites.textoMax,
    });
  }
  return salida;
}

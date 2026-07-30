/**
 * PUBLICADORES ENCHUFABLES — sección 4, punto 3.
 *
 * Cada plataforma declara sus límites y cómo publica. Agregar TikTok o
 * LinkedIn mañana es un archivo nuevo y una línea aquí; el calendario no
 * cambia.
 *
 * MODO:
 *   'automatico' → la plataforma publica por API.
 *   'asistido'   → a la hora programada se le avisa a una persona con el copy
 *                  y el archivo listos, y esa persona pega el enlace al volver.
 *
 * El modo que manda es el de la CUENTA (`content_channels.mode`), no el de
 * aquí: mientras Meta no apruebe los permisos, una página de Facebook se
 * trabaja en asistido aunque su publicador sepa hacerlo solo. Lo de aquí es el
 * techo — lo máximo que esa plataforma permite hoy.
 */

export type Plataforma =
  | "facebook"
  | "instagram"
  | "instagram_stories"
  | "tiktok"
  | "linkedin"
  | "x";

export type LimitesCanal = {
  textoMax: number;
  imagenesMax: number;
  videoSegundosMax?: number;
  formatos: string[];
  proporciones: string[];
  /** Si es true, no se puede programar sin al menos un activo. */
  exigeActivo: boolean;
};

export type PublicacionHecha = { externalId: string; url: string };

export type Publicador = {
  plataforma: Plataforma;
  etiqueta: string;
  /** El máximo que hoy permite esta plataforma. */
  modoMaximo: "automatico" | "asistido";
  limites: LimitesCanal;
  /**
   * Publica de verdad. Solo lo implementan los de modo automático; los
   * asistidos no lo traen porque su "publicación" la hace una persona.
   *
   * CONECTAR: las credenciales llegan en `credenciales`, tomadas de
   * content_channels.credentials (cuenta del cliente). Ninguna vive en código.
   */
  publicar?: (entrada: {
    texto: string;
    activos: string[];
    credenciales: Record<string, unknown> | null;
  }) => Promise<PublicacionHecha>;
};

const IMAGEN = ["jpg", "jpeg", "png", "webp"];
const VIDEO = ["mp4", "mov"];

export const PUBLICADORES: Record<Plataforma, Publicador> = {
  facebook: {
    plataforma: "facebook",
    etiqueta: "Facebook (página)",
    // Graph API. La app de Meta ya existe; falta el permiso
    // `pages_manage_posts`, que es insumo del cliente.
    modoMaximo: "automatico",
    limites: {
      textoMax: 63206,
      imagenesMax: 10,
      videoSegundosMax: 240 * 60,
      formatos: [...IMAGEN, ...VIDEO],
      proporciones: ["1:1", "4:5", "16:9", "9:16"],
      exigeActivo: false,
    },
    publicar: async () => {
      // CONECTAR: POST /{page-id}/feed con el page access token del cliente.
      // Se implementa cuando Meta apruebe `pages_manage_posts`; mientras
      // tanto el canal se configura como 'asistido' y una persona publica.
      throw new Error(
        "Facebook automático necesita el permiso pages_manage_posts aprobado por Meta. Configura el canal como asistido mientras tanto.",
      );
    },
  },
  instagram: {
    plataforma: "instagram",
    etiqueta: "Instagram (feed y reels)",
    modoMaximo: "automatico",
    limites: {
      textoMax: 2200,
      imagenesMax: 10,
      videoSegundosMax: 90,
      formatos: [...IMAGEN, ...VIDEO],
      proporciones: ["1:1", "4:5", "9:16"],
      // Instagram no publica sin imagen o video. Detectarlo al programar evita
      // descubrirlo a la hora de publicar, cuando ya no hay quien lo arregle.
      exigeActivo: true,
    },
    publicar: async () => {
      // CONECTAR: /{ig-user-id}/media + /media_publish con el token del cliente.
      throw new Error(
        "Instagram automático necesita el permiso instagram_content_publish aprobado por Meta. Configura el canal como asistido mientras tanto.",
      );
    },
  },
  instagram_stories: {
    plataforma: "instagram_stories",
    etiqueta: "Instagram Stories",
    // La API no publica historias de forma confiable: se asiste, y se dice.
    modoMaximo: "asistido",
    limites: {
      textoMax: 0, // la historia es el activo; el copy va como nota para quien publica
      imagenesMax: 1,
      videoSegundosMax: 60,
      formatos: [...IMAGEN, ...VIDEO],
      proporciones: ["9:16"],
      exigeActivo: true,
    },
  },
  tiktok: {
    plataforma: "tiktok",
    etiqueta: "TikTok",
    modoMaximo: "asistido",
    limites: {
      textoMax: 2200,
      imagenesMax: 0,
      videoSegundosMax: 600,
      formatos: VIDEO,
      proporciones: ["9:16"],
      exigeActivo: true,
    },
  },
  linkedin: {
    plataforma: "linkedin",
    etiqueta: "LinkedIn",
    modoMaximo: "asistido",
    limites: {
      textoMax: 3000,
      imagenesMax: 9,
      formatos: [...IMAGEN, ...VIDEO],
      proporciones: ["1:1", "16:9"],
      exigeActivo: false,
    },
  },
  x: {
    plataforma: "x",
    etiqueta: "X",
    modoMaximo: "asistido",
    limites: {
      textoMax: 280,
      imagenesMax: 4,
      videoSegundosMax: 140,
      formatos: [...IMAGEN, ...VIDEO],
      proporciones: ["1:1", "16:9"],
      exigeActivo: false,
    },
  },
};

export function publicadorDe(plataforma: string): Publicador | undefined {
  return PUBLICADORES[plataforma as Plataforma];
}

/** Las plataformas que hoy pueden publicarse solas (con credenciales). */
export function plataformasAutomaticas(): Plataforma[] {
  return (Object.keys(PUBLICADORES) as Plataforma[]).filter(
    (p) => PUBLICADORES[p].modoMaximo === "automatico",
  );
}

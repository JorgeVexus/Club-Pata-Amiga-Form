"use client";

import { useMemo, useState, useTransition } from "react";
import {
  activarCanal,
  aprobarPost,
  borrarBorrador,
  cancelarProgramado,
  devolverPost,
  duplicarPost,
  enviarARevision,
  guardarCanal,
  guardarPost,
  marcarAsistidoPublicado,
  programarPost,
  subirActivo,
} from "@/app/ventas/calendario/actions";
import { PUBLICADORES } from "@/lib/content/registry";
import { validarContenido, type Problema } from "@/lib/content/validar";

export type CanalFila = {
  id: string;
  plataforma: string;
  etiqueta: string;
  handle: string;
  nombre: string | null;
  modo: "automatico" | "asistido";
  modoMaximo: "automatico" | "asistido";
  responsable: string | null;
  responsableId: string | null;
  activo: boolean;
  ultimoError: string | null;
};

export type PostFila = {
  id: string;
  titulo: string;
  cuerpo: string;
  activos: string[];
  canalIds: string[];
  resultados: { canalId: string; estado: string; url: string | null; error: string | null }[];
  programadoPara: string | null;
  estado: string;
  aprobadoPor: string | null;
  notaDeRevision: string | null;
  campana: string | null;
  autor: string;
  esMio: boolean;
  creadoEl: string;
};

const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-cream text-ink-secondary",
  revision: "bg-orange/25 text-ink-title",
  aprobado: "bg-lime/40 text-ink-title",
  programado: "bg-teal/20 text-ink-title",
  publicado: "bg-teal text-white",
  fallido: "bg-red-100 text-red-800",
  cancelado: "bg-ink-tertiary/20 text-ink-secondary",
};

const ETIQUETA_CAMPO =
  "text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary";
const CAMPO =
  "h-[36px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] outline-none focus:border-teal";

function fecha(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** El input datetime-local quiere la hora local sin zona. */
function paraInput(iso: string | null) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 60 * 60 * 1000);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function Calendario({
  posts,
  canales,
  equipo,
  puedeRedactar,
  puedeAprobar,
  puedeCanales,
  puedeSaltar,
}: {
  posts: PostFila[];
  canales: CanalFila[];
  equipo: { id: string; nombre: string }[];
  puedeRedactar: boolean;
  puedeAprobar: boolean;
  puedeCanales: boolean;
  puedeSaltar: boolean;
}) {
  const [vista, setVista] = useState<"lista" | "mes" | "cuentas">("lista");
  const [editando, setEditando] = useState<PostFila | "nuevo" | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const decir = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 9000);
  };

  const enRevision = posts.filter((p) => p.estado === "revision");
  const canalPorId = useMemo(
    () => new Map(canales.map((c) => [c.id, c])),
    [canales],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Cola de revisión: es la pantalla del gerente, así que va arriba */}
      {enRevision.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[16px] border-[1.5px] border-orange/50 bg-orange/[.06] p-[18px]">
          <span className="text-[13.5px] font-bold text-ink-title">
            Requiere revisión ({enRevision.length})
          </span>
          {enRevision.map((p) => (
            <TarjetaRevision
              key={p.id}
              post={p}
              canales={p.canalIds.map((id) => canalPorId.get(id)?.etiqueta ?? "—").join(" · ")}
              puedeAprobar={puedeAprobar}
              pendiente={pendiente}
              onAbrir={() => setEditando(p)}
              onAprobar={() =>
                startTransition(async () => {
                  const r = await aprobarPost(p.id);
                  decir("error" in r && r.error ? r.error : "Aprobado ✓ — ya se puede programar");
                })
              }
              onDevolver={(comentario) =>
                startTransition(async () => {
                  const r = await devolverPost(p.id, comentario);
                  decir("error" in r && r.error ? r.error : "Devuelto con tu comentario ✓");
                })
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["lista", "mes", "cuentas"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold ${
              vista === v ? "bg-ink-title text-white" : "bg-white text-ink-secondary"
            }`}
          >
            {v === "lista" ? "Lista" : v === "mes" ? "Mes" : "Cuentas"}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2">
          {aviso && <span className="text-[12px] font-bold text-success-text">{aviso}</span>}
          {puedeRedactar && vista !== "cuentas" && (
            <button
              type="button"
              onClick={() => setEditando("nuevo")}
              className="rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep"
            >
              + Nuevo contenido
            </button>
          )}
        </span>
      </div>

      {editando && (
        <Editor
          post={editando === "nuevo" ? null : editando}
          canales={canales.filter((c) => c.activo)}
          puedeSaltar={puedeSaltar}
          pendiente={pendiente}
          onCerrar={() => setEditando(null)}
          onAviso={decir}
          startTransition={startTransition}
        />
      )}

      {vista === "lista" && (
        <ListaPosts
          posts={posts}
          canalPorId={canalPorId}
          puedeRedactar={puedeRedactar}
          pendiente={pendiente}
          onAbrir={setEditando}
          onAviso={decir}
          startTransition={startTransition}
        />
      )}

      {vista === "mes" && <VistaMes posts={posts} onAbrir={setEditando} />}

      {vista === "cuentas" && (
        <Cuentas
          canales={canales}
          equipo={equipo}
          puedeCanales={puedeCanales}
          pendiente={pendiente}
          onAviso={decir}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------ cola de revisión -- */

function TarjetaRevision({
  post,
  canales,
  puedeAprobar,
  pendiente,
  onAbrir,
  onAprobar,
  onDevolver,
}: {
  post: PostFila;
  canales: string;
  puedeAprobar: boolean;
  pendiente: boolean;
  onAbrir: () => void;
  onAprobar: () => void;
  onDevolver: (comentario: string) => void;
}) {
  const [devolviendo, setDevolviendo] = useState(false);
  const [comentario, setComentario] = useState("");

  return (
    <div className="flex flex-col gap-2 rounded-[12px] bg-white p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <button
          type="button"
          onClick={onAbrir}
          className="text-[13px] font-bold text-ink-title underline decoration-dotted"
        >
          {post.titulo}
        </button>
        <span className="text-[11.5px] text-ink-tertiary">
          {post.autor} · {canales || "sin canales"}
        </span>
      </div>
      <p className="line-clamp-2 text-[12px] text-ink-body">{post.cuerpo}</p>

      {puedeAprobar && !devolviendo && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={onAprobar}
            className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Aprobar
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => setDevolviendo(true)}
            className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)]"
          >
            Devolver…
          </button>
        </div>
      )}

      {puedeAprobar && devolviendo && (
        <div className="flex flex-col gap-2">
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Qué hay que cambiar (obligatorio)"
            className={CAMPO}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pendiente || !comentario.trim()}
              onClick={() => {
                onDevolver(comentario);
                setDevolviendo(false);
                setComentario("");
              }}
              className="rounded-full bg-orange px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
            >
              Devolver a borrador
            </button>
            <button
              type="button"
              onClick={() => setDevolviendo(false)}
              className="text-[12px] font-semibold text-ink-tertiary underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!puedeAprobar && (
        <span className="text-[11.5px] text-ink-tertiary">
          Esperando a un gerente. Tu rol no aprueba contenido.
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- editor ---- */

function Editor({
  post,
  canales,
  puedeSaltar,
  pendiente,
  onCerrar,
  onAviso,
  startTransition,
}: {
  post: PostFila | null;
  canales: CanalFila[];
  puedeSaltar: boolean;
  pendiente: boolean;
  onCerrar: () => void;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [titulo, setTitulo] = useState(post?.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(post?.cuerpo ?? "");
  const [activos, setActivos] = useState<string[]>(post?.activos ?? []);
  const [canalIds, setCanalIds] = useState<string[]>(post?.canalIds ?? []);
  const [campana, setCampana] = useState(post?.campana ?? "");
  const [cuando, setCuando] = useState(paraInput(post?.programadoPara ?? null));
  const [saltar, setSaltar] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  const plataformas = canalIds
    .map((id) => canales.find((c) => c.id === id)?.plataforma)
    .filter((p): p is string => !!p);

  // Las validaciones corren aquí en vivo Y otra vez en el servidor. Esto es
  // para que la persona vea el problema mientras escribe; lo que decide es el
  // servidor.
  const problemas: Problema[] = useMemo(
    () => validarContenido({ titulo, texto: cuerpo, activos, plataformas }),
    [titulo, cuerpo, activos, plataformas],
  );
  const terminologia = problemas.filter((p) => p.clase === "terminologia");
  const otros = problemas.filter((p) => p.clase !== "terminologia");

  const guardar = (despues?: (id: string) => void) =>
    startTransition(async () => {
      const r = await guardarPost({
        id: post?.id,
        titulo,
        cuerpo,
        activos,
        canalIds,
        campana,
      });
      if ("error" in r) return onAviso(r.error ?? "No se pudo guardar.");
      onAviso("Guardado ✓");
      if (despues && r.id) despues(r.id);
    });

  return (
    <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-bold text-ink-title">
          {post ? `Editar: ${post.titulo}` : "Contenido nuevo"}
        </span>
        <button
          type="button"
          onClick={onCerrar}
          className="text-[12px] font-semibold text-ink-tertiary underline"
        >
          Cerrar
        </button>
      </div>

      {post?.notaDeRevision && (
        <p className="rounded-[10px] bg-orange/10 px-3 py-2 text-[12px] text-ink-body">
          <strong>Devuelto:</strong> {post.notaDeRevision}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>TÍTULO (interno, para reconocerlo)</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>COPY</span>
        <textarea
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          rows={6}
          className="rounded-[10px] border-[1.5px] border-border-input bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-teal"
        />
      </label>

      {/* Contador por red: cada una tiene su límite */}
      {plataformas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...new Set(plataformas)].map((p) => {
            const lim = PUBLICADORES[p as keyof typeof PUBLICADORES]?.limites.textoMax ?? 0;
            if (!lim) return null;
            const sobra = cuerpo.length > lim;
            return (
              <span
                key={p}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  sobra ? "bg-orange/25 text-ink-title" : "bg-cream text-ink-secondary"
                }`}
              >
                {PUBLICADORES[p as keyof typeof PUBLICADORES]?.etiqueta}: {cuerpo.length}/{lim}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>CANALES DESTINO</span>
        {canales.length === 0 ? (
          <span className="text-[12px] text-ink-tertiary">
            No hay cuentas conectadas todavía. Ve a la pestaña Cuentas.
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {canales.map((c) => {
              const puesto = canalIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setCanalIds(
                      puesto ? canalIds.filter((x) => x !== c.id) : [...canalIds, c.id],
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    puesto ? "bg-teal text-white" : "bg-cream text-ink-secondary"
                  }`}
                >
                  {c.etiqueta} @{c.handle}
                  {c.modo === "asistido" && " · asistido"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>ACTIVOS</span>
        {activos.map((a) => (
          <span key={a} className="flex items-center gap-2 text-[11.5px] text-ink-body">
            <a href={a} target="_blank" rel="noreferrer" className="truncate underline">
              {a.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => setActivos(activos.filter((x) => x !== a))}
              className="text-ink-tertiary underline"
            >
              quitar
            </button>
          </span>
        ))}
        <input
          type="file"
          disabled={subiendo}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSubiendo(true);
            const fd = new FormData();
            fd.append("file", file);
            const r = await subirActivo(fd);
            setSubiendo(false);
            e.target.value = "";
            if ("error" in r) onAviso(r.error ?? "No se pudo subir.");
            else if (r.url) setActivos((prev) => [...prev, r.url]);
          }}
          className="text-[12px] text-ink-secondary"
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>CAMPAÑA (opcional)</span>
        <input value={campana} onChange={(e) => setCampana(e.target.value)} className={CAMPO} />
      </label>

      {/* Validaciones en vivo */}
      {terminologia.length > 0 && (
        <div className="flex flex-col gap-1 rounded-[12px] border-[1.5px] border-red-300 bg-red-50 p-3">
          <span className="text-[12px] font-bold text-red-800">
            Terminología vinculante — esto no se puede publicar
          </span>
          {terminologia.map((p, i) => (
            <span key={i} className="text-[12px] text-red-900">
              {p.mensaje}
            </span>
          ))}
          <span className="text-[11px] text-red-800">
            No hay forma de saltarla: ni un super admin puede.
          </span>
        </div>
      )}

      {otros.length > 0 && (
        <div className="flex flex-col gap-1 rounded-[12px] bg-cream p-3">
          <span className="text-[11px] font-extrabold text-ink-tertiary">
            REVISAR ANTES DE PROGRAMAR
          </span>
          {otros.map((p, i) => (
            <span key={i} className="text-[12px] text-ink-body">
              {p.canal ? `${p.canal}: ` : ""}
              {p.mensaje}
            </span>
          ))}
          {puedeSaltar && (
            <div className="mt-1 flex flex-wrap gap-3">
              {[...new Set(otros.map((p) => p.clase))].map((clase) => (
                <label key={clase} className="flex items-center gap-1.5 text-[11.5px]">
                  <input
                    type="checkbox"
                    checked={saltar.includes(clase)}
                    onChange={(e) =>
                      setSaltar(
                        e.target.checked
                          ? [...saltar, clase]
                          : saltar.filter((c) => c !== clase),
                      )
                    }
                    className="h-4 w-4 accent-teal"
                  />
                  Saltar «{clase}» dejando constancia
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => guardar()}
          className="rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-50"
        >
          Guardar borrador
        </button>

        <button
          type="button"
          disabled={pendiente || terminologia.length > 0}
          onClick={() =>
            guardar((id) =>
              startTransition(async () => {
                const r = await enviarARevision(id);
                onAviso("error" in r && r.error ? r.error : "Enviado a revisión ✓");
                onCerrar();
              }),
            )
          }
          className="rounded-full bg-orange px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-40"
        >
          Enviar a revisión
        </button>

        {post && ["aprobado", "programado"].includes(post.estado) && (
          <>
            <label className="flex flex-col gap-1">
              <span className={ETIQUETA_CAMPO}>FECHA Y HORA</span>
              <input
                type="datetime-local"
                value={cuando}
                onChange={(e) => setCuando(e.target.value)}
                className={CAMPO}
              />
            </label>
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await programarPost({
                    postId: post.id,
                    fechaHora: cuando,
                    saltar,
                  });
                  onAviso("error" in r && r.error ? r.error : "Programado ✓");
                })
              }
              className="rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {post.estado === "programado" ? "Reprogramar" : "Programar"}
            </button>
          </>
        )}
      </div>

      {post && (
        <span className="text-[11px] text-ink-tertiary">
          Si cambias el copy o los activos de algo ya aprobado, vuelve a revisión
          automáticamente.
        </span>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- lista ---- */

function ListaPosts({
  posts,
  canalPorId,
  puedeRedactar,
  pendiente,
  onAbrir,
  onAviso,
  startTransition,
}: {
  posts: PostFila[];
  canalPorId: Map<string, CanalFila>;
  puedeRedactar: boolean;
  pendiente: boolean;
  onAbrir: (p: PostFila) => void;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [filtro, setFiltro] = useState("");

  const visibles = posts.filter(
    (p) => !filtro || p.estado === filtro,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {/* Los filtros salen de las LLAVES del mapa de estados, no de una
            lista aparte: una lista escrita a mano se desincroniza en cuanto
            aparece un estado nuevo (aquí ya faltaba "cancelado"). */}
        {["", ...Object.keys(ESTADO_COLOR)].map(
          (e) => (
            <button
              key={e || "todos"}
              type="button"
              onClick={() => setFiltro(e)}
              className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${
                filtro === e ? "bg-ink-title text-white" : "bg-white text-ink-secondary"
              }`}
            >
              {e || "todos"}
            </button>
          ),
        )}
      </div>

      {visibles.map((p) => (
        <div
          key={p.id}
          className="flex flex-col gap-1.5 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold text-ink-title">{p.titulo}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                ESTADO_COLOR[p.estado] ?? "bg-cream"
              }`}
            >
              {p.estado}
            </span>
            {p.programadoPara && (
              <span className="text-[11.5px] text-ink-secondary">📅 {fecha(p.programadoPara)}</span>
            )}
            <span className="ml-auto text-[11px] text-ink-tertiary">{p.autor}</span>
          </div>

          <p className="line-clamp-2 text-[12px] text-ink-body">{p.cuerpo}</p>

          <span className="flex flex-wrap gap-1.5">
            {p.canalIds.map((id) => {
              const c = canalPorId.get(id);
              const r = p.resultados.find((x) => x.canalId === id);
              return (
                <span
                  key={id}
                  className={`rounded-full px-2 py-0.5 text-[10.5px] ${
                    r?.estado === "publicado"
                      ? "bg-teal text-white"
                      : r?.estado === "fallido"
                        ? "bg-red-100 text-red-800"
                        : "bg-cream text-ink-secondary"
                  }`}
                  title={r?.error ?? undefined}
                >
                  {c?.etiqueta ?? "canal"}
                  {r?.estado && r.estado !== "pendiente" ? ` · ${r.estado}` : ""}
                </span>
              );
            })}
          </span>

          {p.aprobadoPor && (
            <span className="text-[11px] text-ink-tertiary">Aprobado por {p.aprobadoPor}</span>
          )}

          {/* Canales asistidos esperando a que una persona pegue el enlace */}
          {puedeRedactar &&
            p.resultados
              .filter((r) => r.estado === "asistido")
              .map((r) => (
                <CerrarAsistido
                  key={r.canalId}
                  postId={p.id}
                  canalId={r.canalId}
                  canal={canalPorId.get(r.canalId)?.etiqueta ?? "el canal"}
                  pendiente={pendiente}
                  onAviso={onAviso}
                  startTransition={startTransition}
                />
              ))}

          {puedeRedactar && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onAbrir(p)}
                className="text-[11.5px] font-semibold text-teal underline"
              >
                Abrir
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    const r = await duplicarPost(p.id);
                    onAviso("error" in r && r.error ? r.error : "Duplicado como borrador nuevo ✓");
                  })
                }
                className="text-[11.5px] font-semibold text-ink-tertiary underline"
              >
                Duplicar
              </button>
              {p.estado === "programado" && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await cancelarProgramado(p.id, "Cancelado desde el calendario");
                      onAviso(
                        "error" in r && r.error ? r.error : "Cancelado: sigue aprobado, sin hora ✓",
                      );
                    })
                  }
                  className="text-[11.5px] font-semibold text-orange underline"
                >
                  Cancelar publicación
                </button>
              )}
              {["borrador", "cancelado"].includes(p.estado) && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await borrarBorrador(p.id);
                      onAviso("error" in r && r.error ? r.error : "Borrador eliminado ✓");
                    })
                  }
                  className="text-[11.5px] font-semibold text-ink-tertiary underline"
                >
                  Borrar
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {visibles.length === 0 && (
        <p className="rounded-[14px] bg-white px-5 py-8 text-center text-[12.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          Nada por aquí todavía.
        </p>
      )}
    </div>
  );
}

/**
 * Modo asistido: la persona ya publicó a mano y pega el enlace. Con eso el
 * calendario queda completo aunque la publicación no la haya hecho la máquina.
 */
function CerrarAsistido({
  postId,
  canalId,
  canal,
  pendiente,
  onAviso,
  startTransition,
}: {
  postId: string;
  canalId: string;
  canal: string;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-orange/[.08] px-3 py-2">
      <span className="text-[11.5px] font-semibold text-ink-title">
        {canal}: te toca publicarlo a mano
      </span>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Pega aquí el enlace de la publicación"
        className="h-[30px] min-w-[200px] flex-1 rounded-[8px] border-[1.5px] border-border-input px-2 text-[12px] outline-none focus:border-teal"
      />
      <button
        type="button"
        disabled={pendiente || !url.trim()}
        onClick={() =>
          startTransition(async () => {
            const r = await marcarAsistidoPublicado({ postId, canalId, url });
            onAviso("error" in r && r.error ? r.error : "Marcado como publicado ✓");
          })
        }
        className="rounded-full bg-teal px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-40"
      >
        Ya lo publiqué
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- mes ---- */

function VistaMes({
  posts,
  onAbrir,
}: {
  posts: PostFila[];
  onAbrir: (p: PostFila) => void;
}) {
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const dias = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const ultimo = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    // La semana empieza en lunes.
    const relleno = (primero.getDay() + 6) % 7;
    const celdas: (Date | null)[] = Array(relleno).fill(null);
    for (let d = 1; d <= ultimo.getDate(); d++)
      celdas.push(new Date(mes.getFullYear(), mes.getMonth(), d));
    return celdas;
  }, [mes]);

  const porDia = useMemo(() => {
    const m = new Map<string, PostFila[]>();
    for (const p of posts) {
      if (!p.programadoPara) continue;
      const k = new Date(p.programadoPara).toDateString();
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return m;
  }, [posts]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-ink-secondary"
        >
          ←
        </button>
        <span className="text-[13.5px] font-bold text-ink-title">
          {mes.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-ink-secondary"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-ink-tertiary">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => (
          <div
            key={i}
            className={`min-h-[64px] rounded-[8px] p-1 ${d ? "bg-white" : "bg-transparent"}`}
          >
            {d && (
              <>
                <span className="text-[10.5px] font-bold text-ink-tertiary">{d.getDate()}</span>
                {(porDia.get(d.toDateString()) ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAbrir(p)}
                    title={p.titulo}
                    className={`mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[9.5px] font-semibold ${
                      ESTADO_COLOR[p.estado] ?? "bg-cream"
                    }`}
                  >
                    {p.titulo}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- cuentas ---- */

function Cuentas({
  canales,
  equipo,
  puedeCanales,
  pendiente,
  onAviso,
  startTransition,
}: {
  canales: CanalFila[];
  equipo: { id: string; nombre: string }[];
  puedeCanales: boolean;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [plataforma, setPlataforma] = useState("facebook");
  const [handle, setHandle] = useState("");
  const [nombre, setNombre] = useState("");
  const [modo, setModo] = useState<"automatico" | "asistido">("asistido");
  const [responsable, setResponsable] = useState("");

  const techo = PUBLICADORES[plataforma as keyof typeof PUBLICADORES]?.modoMaximo;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] leading-snug text-ink-secondary">
        Una cuenta en <strong>asistido</strong> no publica sola: a la hora
        programada le avisa a su responsable con el copy y el archivo listos, y
        esa persona pega el enlace al volver. Es la diferencia honesta entre “no
        lo tenemos” y “lo tenemos con una persona en medio”.
      </p>

      {puedeCanales && (
        <div className="flex flex-wrap items-end gap-2.5 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <label className="flex flex-col gap-1">
            <span className={ETIQUETA_CAMPO}>RED</span>
            <select
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              className={CAMPO}
            >
              {Object.values(PUBLICADORES).map((p) => (
                <option key={p.plataforma} value={p.plataforma}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={ETIQUETA_CAMPO}>CUENTA (@)</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="pataamigamx"
              className={`${CAMPO} w-[170px]`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ETIQUETA_CAMPO}>NOMBRE VISIBLE</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`${CAMPO} w-[170px]`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ETIQUETA_CAMPO}>MODO</span>
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value as "automatico" | "asistido")}
              className={CAMPO}
            >
              <option value="asistido">Asistido (una persona publica)</option>
              <option value="automatico" disabled={techo !== "automatico"}>
                Automático{techo !== "automatico" ? " — esta red no lo permite" : ""}
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={ETIQUETA_CAMPO}>RESPONSABLE (asistido)</span>
            <select
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className={CAMPO}
            >
              <option value="">Sin asignar</option>
              {equipo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              startTransition(async () => {
                const r = await guardarCanal({
                  plataforma,
                  handle,
                  nombre,
                  modo,
                  responsableId: responsable,
                });
                if ("error" in r) onAviso(r.error ?? "No se pudo guardar.");
                else {
                  onAviso("Cuenta conectada ✓");
                  setHandle("");
                  setNombre("");
                }
              })
            }
            className="rounded-full bg-teal px-5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Conectar cuenta
          </button>
        </div>
      )}

      {canales.map((c) => (
        <div
          key={c.id}
          className={`flex flex-wrap items-center gap-2 rounded-[14px] p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)] ${
            c.activo ? "bg-white" : "bg-cream/60"
          }`}
        >
          <span className="text-[13px] font-bold text-ink-title">
            {c.etiqueta} · @{c.handle}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              c.modo === "automatico" ? "bg-lime/40 text-ink-title" : "bg-cream text-ink-secondary"
            }`}
          >
            {c.modo}
          </span>
          {c.modo === "asistido" && c.modoMaximo === "automatico" && (
            <span className="text-[11px] text-ink-tertiary">
              (esta red sí publica sola; falta el permiso de Meta)
            </span>
          )}
          {c.responsable && (
            <span className="text-[11.5px] text-ink-secondary">avisa a {c.responsable}</span>
          )}
          {c.ultimoError && (
            <span className="text-[11px] text-red-700">último error: {c.ultimoError}</span>
          )}
          {puedeCanales && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  await activarCanal(c.id, !c.activo);
                  onAviso(c.activo ? "Cuenta apagada ✓" : "Cuenta encendida ✓");
                })
              }
              className="ml-auto text-[11.5px] font-semibold text-ink-tertiary underline"
            >
              {c.activo ? "Apagar" : "Encender"}
            </button>
          )}
        </div>
      ))}

      {canales.length === 0 && (
        <p className="rounded-[14px] bg-white px-5 py-8 text-center text-[12.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          No hay cuentas conectadas.
        </p>
      )}
    </div>
  );
}

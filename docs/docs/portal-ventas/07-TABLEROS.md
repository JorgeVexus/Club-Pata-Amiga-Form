# Portal de ventas — Sección 7: Tableros, exportar y compartir

> **Estado:** propuesta para aprobación.
> **Depende de:** las secciones 1 a 6 (mide lo que ellas producen). Se construye
> al final, cuando ya hay qué medir.

---

## 1. La regla: mismos componentes, mismo comportamiento

El panel de administración ya tiene su tablero (`/admin`): tarjetas con etiqueta
y valor, dos gráficas `MiniBarChart` ("Nuevos miembros por mes", "Reintegros
aprobados"), colas de pendientes con su contador, panel de errores, fichas
emergentes con permisos por rol (`DetailModal`) y **envío del reporte por correo**
a los destinatarios de *Sitio web → Notificaciones* (`ReportButton` + `sendReport`).

El tablero de ventas **usa exactamente esas piezas** —ya mudadas a
`components/panel/` en la Fase 0— con otros números. No hay un segundo sistema de
gráficas ni una segunda forma de exportar.

Y al revés: las tarjetas de ventas relevantes aparecen **dentro de `/admin`**,
con la misma lógica de clic → ficha emergente con el detalle completo, y
`super_admin` viendo más que `admin`.

---

## 2. Qué mide

### 2.1 Embudo (el corazón del tablero)

El embudo con las etapas de la Sección 1.5, cada una con **conteo y suma en
pesos**, y la tasa de paso entre etapas:

```
Nuevo prospecto → Solicitud de llamada → Registro iniciado
→ Carrito abandonado → Pago procesado → Miembro activo
```

Con los números de hoy (742 · 17 · — · 228 · 2 · 0) el embudo va a mostrar de
entrada dónde está la fuga. Ese es el punto.

Cada etapa es clicable: abre la lista de esas oportunidades, filtrable, con
exportación a CSV.

### 2.2 Tarjetas

| Tarjeta | Qué |
| --- | --- |
| PROSPECTOS DEL MES | Nuevos contactos, con su origen |
| CONVERSIÓN | % de prospectos del período que llegaron a miembro |
| CARRITOS ABANDONADOS | Cuántos, cuántos recuperados, MXN recuperados |
| MRR NUEVO | Ingreso recurrente agregado en el período |
| TIEMPO DE PRIMERA RESPUESTA | Mediana, por canal |
| SIN ATENDER | Sin leer y sin asignar, ahora mismo |
| ATENDIDAS POR IA | % resueltas sin persona · escalaciones |
| CONTENIDO | Publicados, pendientes de aprobación, fallidos |
| BOLETÍN | Enviados, entregados, aperturas, bajas |
| AGENTE DEMO | Conversaciones, % que piden persona, % que se hacen miembros |
| CUPONES | Usos y MXN descontados |
| POR EMBAJADOR | Referidos convertidos y comisión generada |

La mediana del tiempo de primera respuesta, no el promedio: un caso olvidado tres
días mueve el promedio y esconde que el resto se contesta rápido.

### 2.3 Gráficas

Con `MiniBarChart`, mismo estilo que las del panel: prospectos por mes ·
conversiones por mes · MXN nuevos por mes · conversaciones por canal ·
publicaciones por canal.

### 2.4 Por persona

Tabla por ejecutivo: conversaciones atendidas, mediana de primera respuesta,
oportunidades ganadas y perdidas, MXN ganados, tareas vencidas.

**Un `ventas` ve solo su propio renglón** (la matriz de la Sección 0 dice
"◐ sus números"). El gerente ve todos. Se aplica en la consulta, no ocultando
columnas.

### 2.5 Motivos de pérdida

Distribución de `lost_reasons`. Es el dato que hoy no existe y el que dice qué
arreglar en el discurso de venta.

---

## 3. Rango de fechas y comparación

Selector de período (mes en curso, mes pasado, 30/90 días, año, personalizado) y
**comparación contra el período anterior** con la variación en cada tarjeta. Un
número sin referencia no informa.

El rango elegido afecta todo el tablero, incluidas las gráficas y las listas que
se abren al hacer clic.

---

## 4. Rendimiento

Las consultas del embudo y de tiempos de respuesta pasan sobre miles de mensajes
y oportunidades. Dos medidas:

1. **Índices** sobre `opportunities(stage_id, created_at)`,
   `channel_messages(conversation_id, created_at)`,
   `contact_activities(contact_id, created_at)`.
2. **Agregado diario** en `sales_daily_metrics` (fecha, métrica, valor,
   dimensión), calculado por una tarea nocturna. Las gráficas de tendencia leen
   de ahí; las tarjetas del período en curso se calculan al vuelo. Así el tablero
   abre rápido aunque el histórico crezca.

Si un agregado falta (por ejemplo, la tarea nocturna falló), la gráfica lo dice
en lugar de mostrar un hueco silencioso.

---

## 5. Exportar y compartir — igual que el panel

### 5.1 Reporte por correo

El mismo botón y la misma acción del panel: arma el reporte **en el servidor con
datos vivos** y lo manda a los destinatarios configurados en *Sitio web →
Notificaciones*, con plantilla editable en `/admin/comunicados`. Nada de HTML en
línea.

### 5.2 Reporte recurrente

Se agrega lo que el panel todavía no tiene y el equipo de ventas sí necesita: el
mismo reporte **programado** (semanal o mensual), con los mismos destinatarios,
por tarea programada. Un ajuste en `site_settings`, sin tabla nueva.

Como es el mismo componente compartido, al construirlo aquí **el panel de
administración lo gana también**. Es el principio de la Sección 0 funcionando en
la práctica.

### 5.3 CSV

Toda lista que se abra desde el tablero exporta a CSV con los filtros aplicados.
El CSV respeta los permisos: un `ventas` no puede exportar columnas que no puede
ver en pantalla. Cada exportación queda registrada — quién, qué y cuándo.

### 5.4 Fichas emergentes

Clic en cualquier número → `DetailModal` con el detalle completo, con la misma
lógica de rol que ya usa el panel: `admin` ve lo esencial, `super_admin` ve
identidad, bancarios y fiscales. Los roles de ventas nunca ven eso (Sección 1.4).

---

## 6. Dónde aparece cada cosa

| Superficie | Qué muestra |
| --- | --- |
| `/ventas` (tablero completo) | Todo lo del punto 2, con rango y comparación |
| `/admin` (bloque "Ventas") | Embudo compacto + tarjetas de prospectos, conversión, carritos abandonados, MRR nuevo y sin atender. Clic → ficha o al portal |
| `/ventas` para rol `ventas` | Sus números y el embudo del equipo sin la tabla por persona |

---

## 7. Cómo verificamos que quedó

1. **Cada número del tablero cuadra contra una consulta SQL directa.** Se
   verifica uno por uno, no de vista.
2. Cambiar el rango de fechas cambia todas las tarjetas, gráficas y listas de
   forma consistente.
3. La comparación con el período anterior da la variación correcta en un caso
   calculado a mano.
4. Clic en una etapa del embudo abre exactamente esas oportunidades; el conteo de
   la lista coincide con el de la tarjeta.
5. Con sesión `ventas`: solo aparece su renglón en la tabla por persona, y pedir
   los de otro por la API falla.
6. El CSV exportado no trae columnas sensibles con sesión de ventas.
7. El reporte por correo llega con los mismos números que la pantalla.
8. El reporte recurrente sale en su día y hora, y también quedó disponible en
   `/admin`.
9. La tarea nocturna de agregados corre; si se salta un día, la gráfica lo avisa.
10. Con el tablero vacío (base sin datos) no hay errores ni divisiones entre cero:
    se muestra el estado vacío.
11. Verificado en escritorio y en 375 px (tarjetas apiladas, embudo con
    desplazamiento horizontal, tablas como listas).

---

## 8. Decisiones tomadas y por qué

| Decisión | Por qué |
| --- | --- |
| Mismos componentes que el panel | Una sola forma de graficar, exportar y abrir fichas; y las mejoras se reparten solas |
| Mediana en el tiempo de respuesta | El promedio esconde el problema detrás de un caso viejo |
| Comparación con el período anterior siempre | Un número solo no dice si vamos bien |
| Agregado diario para tendencias | El tablero abre rápido cuando el histórico crece |
| El agregado faltante se avisa | Un hueco silencioso en una gráfica se lee como "no pasó nada" |
| Los permisos se aplican en la consulta | Ocultar una columna no es controlar el acceso |
| Exportaciones registradas | Un CSV con datos de clientes debe dejar rastro de quién lo bajó |
| El embudo es la pieza principal | Es donde están los 228 carritos abandonados que hoy nadie trabaja |
| El reporte recurrente se construye compartido | El panel lo gana gratis |

---

## 9. Fuera de alcance de esta sección

- **Constructor de tableros a la medida** (arrastrar widgets, métricas con
  fórmulas propias, como los Custom Dashboards de GoHighLevel). Métricas
  definidas en código; agregar una es una entrada en un registro.
- **Atribución publicitaria** y widgets de anuncios de Meta.
- **Pronóstico de ventas.**
- **Analítica de contenido más allá de lo publicado** (alcance e interacción
  dependen de permisos de API que no están en este alcance).
- **Exportar a Excel con formato** ni a Google Sheets en vivo. CSV y correo.

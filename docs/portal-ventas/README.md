# Portal de ventas — índice del plan

> **¿Retomando el trabajo?** Empieza por [HANDOFF.md](HANDOFF.md): qué quedó
> construido, qué sigue y con qué criterios se ha trabajado.

Plan completo del portal de ventas (CRM que reemplaza las funciones que el equipo
usa hoy en LynSales / GoHighLevel). **Todo esto es propuesta: nada está construido
todavía.**

Se escribió sección por sección para poder revisarlo y construirlo en ese mismo
orden: una sección aprobada → migración → server actions → interfaz →
verificación en navegador (escritorio y 375 px) → commit → push.

## Punto de retorno

Antes de empezar se guardó el estado actual de la plataforma:

- **Código y esquema:** etiqueta `v1.0-plataforma-base` (commit `cdf68e7`).
- **Datos y archivos:** volcado del proyecto Supabase de desarrollo, fuera del
  repo, en `006_Pata_Amiga/backups/2026-07-26-checkpoint-v1.0/`
  (32 tablas + 17 archivos de Storage + instrucciones de restauración).

## Las secciones

| # | Documento | De qué trata |
| --- | --- | --- |
| 0 | [Arquitectura y roadmap](00-ARQUITECTURA-Y-ROADMAP.md) | Principio de fuente única y dos superficies, roles `ventas` y `gerente_ventas`, matriz de permisos, conmutador de portales, estructura de archivos, modelo de datos general, fases F0–F7, puntos de extensión, no-objetivos, riesgos |
| 1 | [Contactos y pipelines](01-CONTACTOS-Y-PIPELINES.md) | Contacto único por persona con identidades por canal, etiquetas y campos personalizados, deduplicación y fusión, importación desde LynSales, oportunidades en kanban con etapas que se llenan con eventos de la plataforma |
| 2 | [Conversaciones](02-CONVERSACIONES.md) | Bandeja multicanal (Meta, correo, portal), leído por persona, asignación y triaje, notas internas, plantillas con adjuntos, plantillas de WhatsApp, gobierno y guardarraíles de los agentes IA |
| 3 | [Membresías y beneficios](03-MEMBRESIAS-Y-BENEFICIOS.md) | Catálogo de beneficios en código con valores por versión de plan, snapshot en la suscripción (grandfathering), publicación en Stripe, compuerta legal, cupones |
| 4 | [Calendario de contenido](04-CALENDARIO-DE-CONTENIDO.md) | Borrador → revisión → aprobado → programado → publicado, con la aprobación como restricción de base de datos; publicación automática en Meta y asistida en el resto |
| 5 | [Newsletter](05-NEWSLETTER.md) | Calendario editorial anual, agente investigador con brief humano obligatorio, agente de marca sobre plantillas editables, tres compuertas antes de programar, envío por Resend |
| 6 | [Agente demo](06-AGENTE-DEMO.md) | Asistente de demostración para registrados sin membresía: interruptor de `super_admin` apagado por omisión, base reducida, sin datos de miembro, sin orientación veterinaria |
| 7 | [Tableros](07-TABLEROS.md) | Tablero de ventas y tarjetas dentro de `/admin` con los mismos componentes, embudo con pesos, exportación a CSV, reporte por correo y reporte recurrente |

## Orden de construcción

`F0` cimientos ✅ → `F1` contactos y pipelines ✅ (F1a datos · F1b interfaz de
contactos · F1c tablero kanban · F1d eventos de plataforma · F1e importación de
CSV y fusión de duplicados) →
`F2` conversaciones ✅ (F2a triaje y hilo · F2b correo entrante · F2c plantillas,
adjuntos y ventana de WhatsApp · F2d gobierno de los agentes) →
`F3` membresías (F3a motor de beneficios ✅ · F3b planes, Stripe y compuerta
legal ✅ · F3c migrar cohortes y cupones) → `F4` calendario → `F5` newsletter →
`F6` agente demo → `F7` tableros.

F1 se construye en cuatro entregas verificables en lugar de una sola, porque es
la fase más grande del plan.

**F0 entregó:** roles `ventas` y `gerente_ventas` (migraciones 20 y 21, con
`is_sales()` / `is_sales_manager()` para las políticas que vienen),
`src/lib/permissions.ts` como fuente única de capacidades,
`src/lib/panel-guard.ts` (`requirePortal`, `requireCapability`),
`PanelShell` compartido por `/admin` y `/ventas`, conmutador de portales en el
menú de perfil, `/ventas` con resumen de datos reales, y los componentes
compartidos ya en `components/panel/`. Cuentas de prueba:
`ventas@pataamiga.dev` y `gerente@pataamiga.dev` (contraseñas en `CLAUDE.md`).

F3, F4 y F6 no dependen entre sí: si un insumo del cliente se atora, se saltan sin
bloquear el resto. El detalle y los criterios de verificación de cada fase están
en la Sección 0.7.

## Lo que necesitamos del cliente

Ordenado por urgencia, no por fase:

1. **Exportar de LynSales el CSV de contactos y de oportunidades.** La cuenta
   muestra un aviso de método de pago faltante; si se suspende, se pierden las
   989 oportunidades y el histórico de conversaciones. Es lo único urgente.
2. Subdominio de correo decidido (para el buzón compartido del equipo).
3. Permisos extra en la app de Meta: `pages_manage_posts`,
   `instagram_content_publish` (revisión de Meta, 1–3 semanas).
4. Plantillas de WhatsApp redactadas y aprobadas por Meta.
5. Una plantilla de marca del boletín, con ejemplo.
6. Confirmación de que los planes y precios actuales son los definitivos.
7. Quién está de guardia para escalaciones y quién confirma revisiones
   veterinarias del boletín.

Sin ninguno de ellos se puede arrancar: cada pieza faltante se indica en la
interfaz, igual que hoy la bandeja avisa cuando no hay tokens de Meta.

## Decisiones ya tomadas (no volver a discutirlas sin motivo)

- Plan completo escrito antes de construir; después, sección por sección.
- Fuente única y dos superficies: `/admin` y `/ventas` comparten datos y
  componentes; lo que se mejora en uno aparece en el otro.
- Motor de beneficios completo con **planes versionados** y miembros
  grandfathered.
- Canales de la bandeja: Meta, correo (entrante y saliente) y chats del portal.
  **Sin SMS ni llamadas.**
- Dos roles de ventas, **sin acceso a datos personales sensibles**.
- Contactos unificados en una tabla, con relleno desde las 5 fuentes actuales.
- **Sin motor visual de automatizaciones** en esta etapa; la costura queda lista
  (Sección 0.8) para agregarlo sin tocar pantallas.
- Nada se autopublica sin aprobación de un gerente, y hay aviso previo con opción
  de cancelar.
- El newsletter se envía por correo a los suscriptores; **sin página pública**.
- El agente demo es un adelanto con límites duros, apagado por omisión.

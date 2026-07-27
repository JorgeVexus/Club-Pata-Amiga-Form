# Verificación de fase 1: cierre de autorización

Fecha: 2026-07-26

## Objetivo

Cerrar vulnerabilidades críticas sin interrumpir usuarios activos y crear una frontera de identidad reemplazable para la futura migración de Memberstack a Supabase Auth.

## Cambios funcionales

- Las bajas y reingresos de miembros requieren una sesión Memberstack válida y solo afectan al titular.
- Las solicitudes solidarias se crean para el miembro autenticado.
- Los documentos solidarios administrativos requieren rol administrativo confirmado.
- La baja de centros solo afecta al centro autenticado.
- Cambios de estado de centros, comisiones y reintegros requieren administrador.
- Todas las rutas `/api/admin/*`, excepto el bootstrap explícito, verifican JWT y rol.
- El bootstrap administrativo deja de aceptar un secreto fijo incluido en el repositorio.
- Los widgets afectados adjuntan el token Bearer obtenido de la sesión activa.

## Compatibilidad

- Memberstack sigue siendo el proveedor activo.
- No se cambió el esquema de base de datos.
- No se borraron ni transformaron registros existentes.
- No se ejecutaron reembolsos, bajas, reintegros ni sincronizaciones reales durante QA.
- La interfaz neutral `ActorContext` permite sustituir la verificación sin reescribir la lógica de dominio.

## Pruebas añadidas

- Contrato del verificador Memberstack.
- Resolución del actor miembro.
- Autorización JWT administrativa.
- Autorización de baja/reingreso.
- Autorización de solidaridad.
- Autorización de bienestar.
- Autorización de finanzas de embajadores.
- Cobertura de todas las rutas administrativas y ausencia de secreto bootstrap fijo.

## Limitaciones

Esta fase no declara toda la aplicación libre de riesgo. La matriz de autorización identifica rutas heredadas que requieren una migración coordinada de API y widget. Cambiarlas unilateralmente podría bloquear a usuarios existentes. Tampoco se probaron efectos reales contra Stripe, Resend, Memberstack o Supabase productivos; esas pruebas deben ejecutarse en staging con credenciales aisladas y datos reversibles.

## Evidencia de QA

| Verificación                                                        | Resultado                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Suite nativa (`node --test` con todos los `*.test.js`/`*.test.mjs`) | 258 pruebas, 258 aprobadas, 0 fallas.                                  |
| `npm run type-check`                                                | Aprobado, código de salida 0.                                          |
| `npm run lint`                                                      | Aprobado, código de salida 0; 0 errores y 1095 advertencias heredadas. |
| `npm run build`                                                     | Aprobado, código de salida 0; 153 páginas estáticas generadas.         |

Advertencias no bloqueantes observadas:

- Next.js infiere una raíz superior por la presencia de múltiples `package-lock.json`.
- La convención `middleware` está marcada como obsoleta y deberá migrarse a `proxy`.
- La deuda de lint es extensa y preexistente; debe reducirse en un trabajo separado para evitar mezclar refactorizaciones con el cierre de autorización.
- `package.json` no define script `test`; para esta verificación se enumeraron los archivos de prueba y se ejecutaron con el runner nativo de Node.

## Dictamen

La fase 1 está técnicamente apta para revisión local. No se recomienda desplegar todavía sin:

1. Confirmar en staging el login de un administrador, un miembro, un embajador y un centro.
2. Probar solicitudes y bajas con datos reversibles.
3. Configurar `ADMIN_SECRET_CODE` en el entorno donde el bootstrap administrativo deba seguir disponible.
4. Revisar el riesgo residual enumerado en `matriz-autorizacion-endpoints.md`.

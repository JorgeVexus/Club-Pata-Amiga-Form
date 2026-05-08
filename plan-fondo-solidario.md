# Plan de Implementación: Estabilización del Fondo Solidario

Este documento detalla la estrategia para estabilizar el Dashboard del Fondo Solidario, corrigiendo errores de red, inconsistencias en la lógica de elegibilidad y mejoras de interfaz.

## 1. Objetivos Principales
- **Eliminar Errores de Red**: Sustituir placeholders externos fallidos por assets internos.
- **Sincronizar Lógica de Elegibilidad**: Garantizar que el frontend y el backend sigan las mismas reglas estrictas para considerar a una mascota como "Activa".
- **Refinamiento de UI**: Mejorar la visibilidad de los filtros y el contraste de los textos.

## 2. Criterios de Elegibilidad (Reglas de Negocio)
Para que una mascota sea contada como **Activa** (con acceso al fondo), debe cumplir:
1. `status === 'approved'` (Aprobada por administración).
2. `waiting_period_end <= now` (Periodo de carencia finalizado).
3. En caso de ausencia de fechas, el sistema debe ser pesimista y marcarla como **Pendiente**.

## 3. Cambios Técnicos

### Frontend (`public/widgets/solidarity-dashboard.js`)
- **Asset Fallback**: Se utiliza `this.data.placeholders.pet` con una URL interna de Pata Amiga.
- **calculateCarencia**: Implementación robusta que maneja `created_at` nulo o inválido, asignando `isWaiting: true` por defecto.
- **Estilos Inline**: Forzado de `color: black !important` en inputs y selects para Webflow.

### Backend (`src/app/api/solidarity/stats/route.ts`)
- **Strict Validation**: Se eliminó el "legacy fallback" que activaba mascotas sin fecha. Ahora, si no hay fecha de carencia, se queda en `pending`.

## 4. Próximos Pasos (Fase 2)
1. **Flujo de Solicitud**: Implementar el modal multi-paso para "Solicitar Apoyo".
2. **Carga de Documentos**: Integrar con el API de upload para comprobantes médicos.
3. **Validación de Saldo**: Verificar que el fondo tenga recursos antes de permitir nuevas solicitudes (opcional según requerimiento).

---
**Última actualización**: 8 de Mayo, 2026
**Estado**: Estabilización completada.

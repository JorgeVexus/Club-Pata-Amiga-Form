# Adaptación visual del registro v2 al nuevo diseño de Pata Amiga

## Objetivo

Adaptar visualmente el flujo completo de registro v2 de `pet-membership-form` al lenguaje de diseño del repositorio `Chepiztrike/pata-amiga`, conservando intactas la arquitectura, las integraciones y la lógica funcional existentes.

## Alcance

La adaptación cubre:

- Pasos públicos 1–3: cuenta, mascota y plan/pago.
- Pasos postpago 4–6: perfil, expediente de mascota y confirmación final.
- Pantallas y estados intermedios: carga inicial, guardado, pago exitoso, recuperación de sesión, redirección de miembros activos, errores, validaciones, modales y notificaciones.
- Comportamiento responsive para escritorio y móvil.

## Fuera de alcance

- Reescritura o migración de arquitectura.
- Sustitución de Memberstack, Supabase o Stripe.
- Cambios en reglas de negocio, persistencia, navegación o contratos de datos.
- Copia directa de componentes que dependen de la arquitectura del repositorio de referencia.
- Rebuild integral del flujo; se realizará en una etapa futura.

## Dirección visual

- Fondo crema `#FAF7F1` y superficies blancas discretas.
- Turquesa como color principal, con acentos de estado coherentes con el repositorio de referencia.
- Tipografía Fraiche para títulos y Outfit para interfaz y texto.
- Tarjetas de radio moderado, bordes suaves y sombras teñidas de baja intensidad.
- Encabezado compacto con logo, acceso o cierre de sesión y contexto del paso.
- Indicador unificado: píldoras en escritorio y segmentos de progreso en móvil.
- Inputs de radio medio, etiquetas legibles, foco visible y mensajes inline.
- Botones redondeados con estados hover, focus, pressed, loading y disabled.
- Pantalla final sobre fondo turquesa inspirada en “Bienvenido a la manada”.

## Estrategia de implementación

Se conservarán los componentes y manejadores existentes. La adaptación se realizará principalmente mediante CSS Modules y ajustes estructurales mínimos en JSX cuando sean necesarios para reproducir la jerarquía visual del nuevo diseño.

Los pasos 1–3 conservarán la nomenclatura “Tu cuenta”, “Tu peludo” y “Plan y pago”. Los pasos postpago mantendrán sus funciones actuales, presentados como continuidad visual mediante “Completa tu perfil” y “Expediente de tu peludo”.

Los estados transitorios compartirán los mismos tokens, superficies y patrones de feedback para evitar que el usuario perciba saltos entre etapas.

## Protección funcional

- No se cambiarán callbacks, efectos, consultas, acciones de servidor ni contratos de props salvo que un ajuste estructural estrictamente visual lo requiera.
- Se conservarán literalmente los copys actuales del flujo; no se trasladará ni reescribirá el tono editorial del repositorio de referencia.
- Se preservarán parámetros URL, recuperación de sesión, persistencia parcial y rutas actuales.
- No se sobrescribirán los cambios locales ajenos que ya existen en el árbol de trabajo.

## Verificación

- Auditoría de regresión sobre navegación, persistencia y estados del flujo.
- Revisión visual en escritorio y móvil mediante servidor local.
- `npm run build`.
- `npm run type-check`.
- `npm run lint`.
- Corrección de errores encontrados antes de entregar la URL local.

## Criterio de aceptación

Todo el registro v2 y sus pantallas intermedias deben sentirse parte del nuevo sistema visual de Pata Amiga, sin alterar el comportamiento funcional existente.

# Marquee promocional en registro V2

## Objetivo

Integrar un banner tipo marquee al inicio del flujo de registro V2 para mostrar la promoción "Manada Mundialista" en todos los pasos del registro.

## Alcance

- Crear un componente reutilizable dentro de `src/components/RegistrationV2`.
- Renderizarlo como primer elemento visual de `NewRegistrationFlow`.
- Mantener el banner visible al hacer scroll sin usar listeners manuales.
- Ajustar el `NavbarRedesign` para evitar encimarse con el banner sticky.

## Verificación

- Ejecutar `npm run build`.
- Ejecutar `npm run type-check`.
- Ejecutar `npm run lint`.

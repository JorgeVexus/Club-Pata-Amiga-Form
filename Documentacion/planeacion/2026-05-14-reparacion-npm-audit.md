# Reparacin de Vulnerabilidades (npm audit)

Este plan detalla los pasos para resolver las 10 vulnerabilidades (6 de alta prioridad y 4 moderadas) encontradas por `npm audit` sin afectar el funcionamiento del proyecto.

## User Review Required

> [!IMPORTANT]
> Se realizarn actualizaciones de versiones de dependencias principales como `next`, `next-sanity` y `@memberstack/nextjs`. Aunque estas suelen ser seguras entre versiones menores, se realizar una verificacin completa del build.
> Se utilizar la propiedad `overrides` en `package.json` para forzar la actualizacin de dependencias transitivas vulnerables (`axios` y `undici`) que no se actualizan automticamente.

## Open Questions

- Hay algn entorno de staging donde prefieras probar esto antes de aplicarlo a produccin? (Asumir verificacin local mediante `npm run build`).

## Proposed Changes

### [Component Name] Dependency Management

#### [MODIFY] [package.json](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/package.json)
- Actualizar `next` a `16.2.6`.
- Actualizar `next-sanity` a `^12.4.5`.
- Actualizar `@memberstack/nextjs` a `^1.0.4`.
- Aadir `overrides` para `axios` y `undici`.

```json
"overrides": {
  "axios": "^1.7.9",
  "undici": "^6.24.0"
}
```

## Verification Plan

### Automated Tests
- `npm install` para aplicar los cambios.
- `npm audit` para verificar que las vulnerabilidades han sido resueltas.
- `npm run build` para asegurar que la aplicacin compila correctamente con las nuevas versiones.
- `npm run type-check` para validar la integridad de los tipos TypeScript.

### Manual Verification
- Verificacin visual de la pgina principal y el flujo de registro si es posible.

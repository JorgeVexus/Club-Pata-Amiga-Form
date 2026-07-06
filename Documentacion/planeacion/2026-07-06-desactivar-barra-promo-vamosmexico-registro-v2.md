# Desactivar barra promo VamosMexico en registro v2

## Objetivo

Ocultar la barra amarilla promocional del cupon `VAMOSMEXICO` en todas las pantallas del flujo de registro v2 sin eliminar el componente, para poder reactivarlo facilmente en una promo futura.

## Alcance

- Ajustar el contenedor compartido del flujo `RegistrationV2`.
- Mantener el componente promocional existente en el codigo.
- Desactivar la renderizacion mediante una bandera simple y explicita.

## Verificacion

- Ejecutar `npm run type-check`.
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.

# Diseño del formulario de reintegros V2

## Objetivo

Replicar dentro del widget unificado la composición visual de `/app/reintegros/nueva`, conservando la API, validaciones y tipos de datos del Fondo Solidario actual.

## Estructura aprobada

- El tipo de apoyo se selecciona mediante tres tarjetas: gastos veterinarios, fallecimiento y vacunas.
- El saldo de cada tarjeta proviene de `solidarity.balances`; no se duplican reglas de negocio en el navegador.
- La mascota se selecciona mediante botones visuales. Las mascotas no aprobadas o en carencia permanecen visibles pero deshabilitadas.
- Los campos de monto, fecha, descripción y transferencia mantienen los nombres esperados por `/api/solidarity/request`.
- Los documentos se presentan como zonas de carga individuales y cada archivo se envía por `/api/upload/solidarity-document` antes de crear la solicitud.
- La interfaz cambia sus etiquetas y documentos requeridos según el apoyo, pero el backend continúa validando elegibilidad, saldo y carencia.

## Estados e interacción

- La primera categoría con saldo disponible queda seleccionada inicialmente.
- La primera mascota elegible queda seleccionada inicialmente.
- La tarjeta activa y la mascota activa usan turquesa; las opciones bloqueadas conservan una explicación visible.
- Los nombres de archivos seleccionados reemplazan el texto de ayuda de cada zona de carga.
- Los errores de validación o API aparecen dentro del formulario sin abandonar la pantalla.
- Banco es un selector obligatorio. La CLABE preselecciona una institución conocida por sus primeros tres dígitos, pero el usuario puede corregir la selección.
- La CLABE debe tener 18 dígitos y superar la validación del dígito verificador tanto en el widget como en el endpoint.

## Verificación

- Prueba estática del widget para tarjetas, mascotas, cargas y ausencia de dropdowns para esas selecciones.
- Pruebas existentes del cliente API y dashboard.
- Revisión de sintaxis, TypeScript y ESLint dirigido.

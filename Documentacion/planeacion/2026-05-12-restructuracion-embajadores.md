# Plan de Reestructuración: Formulario de Embajadores (Simplificado)

Este plan detalla la simplificación del proceso de registro de embajadores de un flujo de 3 pasos a un solo paso, optimizando la experiencia del usuario y recolectando solo la información esencial.

## Objetivos
1.  **Simplificación**: Reducir el registro a un solo paso.
2.  **Layout**: Cambiar de un diseño de dos columnas a una sola columna.
3.  **Campos**: Solicitar únicamente la información requerida por el usuario.
4.  **Mantenimiento**: Conservar la estética premium (colores, fuentes, micro-animaciones).

## Campos Requeridos
- **Nombre completo**: Un solo campo de texto (se dividirá lógicamente para el backend).
- **Sexo**: Opciones de "Hombre", "Mujer", "No especificar" (Radio buttons).
- **CURP**: Validación de 18 caracteres.
- **Correo**: Validación de formato de email.
- **Celular**: Validación de 10 dígitos.
- **Redes Sociales**: Enlaces opcionales para Facebook, Instagram y TikTok.
- **Motivación**: Campo de texto largo (textarea) para explicar por qué quieren ser embajadores.

## Cambios Propuestos

### 1. Componentes de UI

#### [MODIFY] [AmbassadorForm.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/AmbassadorForm/AmbassadorForm.tsx)
- Eliminar el `currentStep` y la lógica de navegación entre pasos.
- Refactorizar para renderizar un solo contenedor de formulario.
- Integrar la lógica de validación de todos los campos en una sola función `handleSubmit`.
- Mantener la integración con Memberstack (detección de usuario logueado).

#### [NEW] [SimplifiedStep.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/AmbassadorForm/SimplifiedStep.tsx)
- Crear un nuevo componente que contenga todos los campos en una sola columna.
- Utilizar los estilos globales del proyecto (`--color-primary`, `--font-heading`, etc.).

#### [MODIFY] [SimplifiedStep.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/AmbassadorForm/SimplifiedStep.module.css)
- Implementar un diseño de una sola columna con un ancho máximo (ej. 600px) para legibilidad.

### 2. Lógica de Negocio

- **Mapeo de Nombre**: Implementar una utilidad para dividir el "Nombre completo" en `first_name`, `paternal_surname` y `maternal_surname` antes de enviarlo al API.
- **Mapeo de Género**: Mapear "Hombre" -> `male`, "Mujer" -> `female`, "No especificar" -> `not_specified`.
- **Campos Opcionales**: Asegurar que las redes sociales y otros campos no requeridos no bloqueen el envío.
- **Password**: Si el usuario no está logueado, se generará una contraseña temporal o se le pedirá una (se recomienda pedirla para evitar problemas de acceso posterior, aunque no se mencionó en la lista, se consultará con el usuario). *Nota: Por ahora se usará un placeholder si no se especifica.*

### 3. API y Tipos

- **Tipos**: Utilizar el tipo `AmbassadorFormData` existente pero solo poblar los campos necesarios.
- **API**: El endpoint `/api/ambassadors` ya maneja la mayoría de estos campos. Se realizarán pruebas para asegurar que funcione sin los campos de dirección e INE.

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` para asegurar que los cambios en los tipos no rompan el build.
- Ejecutar `npm run build` para verificar la estabilidad del proyecto.

### Pruebas Manuales
1.  **Registro Exitoso**: Completar el formulario con datos válidos y verificar la creación en la base de datos (vía API).
2.  **Validaciones**: Intentar enviar el formulario sin campos obligatorios (CURP, Correo, etc.) y verificar que se muestren los errores correspondientes.
3.  **Responsive**: Verificar que el diseño de una sola columna se vea bien en dispositivos móviles y desktop.

---
**Documento guardado en**: `Documentacion/planeacion/2026-05-12-restructuracion-embajadores.md`

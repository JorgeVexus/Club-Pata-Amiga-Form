# Plan de Implementación: Pantalla Extra de Datos en Registro de Centros de Bienestar

Este plan describe la incorporación de un paso opcional al flujo de registro de Centros de Bienestar (`/bienestar/registro`) para que puedan completar su perfil inmediatamente después de registrarse (subir logo, editar nombre comercial, teléfono, dirección, geolocalización, redes sociales y beneficio para miembros) antes de iniciar sesión.

## Resumen de Cambios

1. **`WellnessForm.tsx`**:
   - Cambiar el estado `showSuccess: boolean` por un estado estructurado de paso `view: 'form' | 'success' | 'complementary' | 'complementary-success'`.
   - Guardar los datos del centro registrado (devueltos por el backend `/api/wellness`) en el estado `registeredCenter`.
   - En la vista `success`:
     - Mostrar el texto de éxito inicial.
     - Agregar la leyenda encima del botón: *"Por lo mientras te invitamos a contarnos más sobre tu Centro de Bienestar terminando tu registro aquí"* (donde "aquí" es un enlace interactivo para cambiar a `view: 'complementary'`).
     - Mantener el botón original "Iniciar sesión" que lleva a la página de login.
   - En la vista `complementary`:
     - Renderizar el componente `WellnessComplementaryForm` pasando el `registeredCenter`.
     - Manejar el evento `onSuccess` del formulario para cambiar a `view: 'complementary-success'`.
   - En la vista `complementary-success`:
     - Mostrar un mensaje de éxito indicando que la información complementaria fue guardada y será revisada para agilizar su aprobación.
     - Mostrar un botón de "Iniciar sesión" que dirija a `https://www.pataamiga.mx/user/inicio-de-sesion`.

2. **`WellnessComplementaryForm.tsx`**:
   - Añadir soporte para editar el campo `establishment_name` (Nombre del establecimiento).
   - Añadir una sección de **Marca y Logo** con un input de archivo oculto y botón "Seleccionar Imagen" para subir el logo del centro usando el endpoint existente `/api/upload/wellness-logo` con el `memberstack_id` del centro.
   - Implementar un subcomponente `BranchCard` y un panel de sucursales adicionales con la pregunta *"¿Tu negocio cuenta con más de una sucursal?"* y opción de "No" y "Si".
   - Soportar agregar múltiples sucursales con su respectivo nombre, teléfono, dirección y coordenadas GPS (manual y autocompletado de mapas).
   - Reorganizar visualmente el formulario en secciones para que coincida con el diseño del perfil (Marca y Logo, Información de Contacto, Ubicación y Geolocalización, Sucursales, Promoción para Miembros, Redes Sociales).
   - Pasar los datos y el array de ubicaciones actualizadas en el payload al API `/api/wellness/update`.

3. **`WellnessForm.module.css`**:
   - Agregar estilos de diseño premium para la sección de carga de imágenes (avatar circular/cuadrado con bordes suaves, hover, animaciones de carga).
   - Agregar estilos para enlaces destacados (`highlightLink`), transiciones de carga y el editor de sucursales (`branchCard`, `branchQuestion`, `branchToggleOptions`, etc.).

---

## Modificaciones Propuestas

### Componentes

#### [MODIFY] [WellnessForm.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/WellnessForm/WellnessForm.tsx)

Modificar la lógica de renderizado y el control de vistas tras el registro exitoso:
```tsx
const [view, setView] = useState<'form' | 'success' | 'complementary' | 'complementary-success'>('form');
const [registeredCenter, setRegisteredCenter] = useState<WellnessCenter | null>(null);
```

#### [MODIFY] [WellnessComplementaryForm.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/WellnessForm/WellnessComplementaryForm.tsx)

Integrar la carga de logotipo y la edición del nombre del establecimiento.

```tsx
// Lógica de carga de logo
const [logoUrl, setLogoUrl] = useState(center.logo_url || '');
const [isUploadingLogo, setIsUploadingLogo] = useState(false);
const [establishmentName, setEstablishmentName] = useState(center.establishment_name || '');
```

Añadir markup para la carga de imágenes usando el endpoint `/api/upload/wellness-logo`.

#### [MODIFY] [WellnessForm.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/WellnessForm/WellnessForm.module.css)

Agregar clases de estilo para:
- `.logoSection`: Contenedor para la sección de logo.
- `.logoPreviewContainer`: Alineación de la vista previa del logo y el botón de selección.
- `.logoPreview`: Imagen circular/redondeada con borde de 2px.
- `.highlightLink`: Enlace de color primary con underline y cursor pointer.
- `.successText`: Margen y diseño de las descripciones de éxito.

---

## Plan de Verificación

### Pruebas Manuales
1. Ir a la ruta `/bienestar/registro`.
2. Registrar un centro de bienestar de prueba.
3. Verificar que al finalizar se muestre la pantalla de éxito con la leyenda: *"Por lo mientras te invitamos a contarnos más sobre tu Centro de Bienestar terminando tu registro aquí"* encima del botón.
4. Hacer clic en "aquí" y verificar la transición a la pantalla complementaria sin recargar la página.
5. Probar subir un logotipo válido (PNG/JPG < 5MB). Verificar la previsualización y guardado en Supabase Storage.
6. Llenar los datos de contacto, geolocalización (arrastrando el marcador en el mapa), beneficio y redes sociales.
7. Hacer clic en "Guardar Información" y verificar la transición a la pantalla final de éxito.
8. Comprobar que el botón "Iniciar sesión" de la pantalla final dirija correctamente a `https://www.pataamiga.mx/user/inicio-de-sesion`.
9. Verificar que se corra `npm run build` y `npm run type-check` sin errores.

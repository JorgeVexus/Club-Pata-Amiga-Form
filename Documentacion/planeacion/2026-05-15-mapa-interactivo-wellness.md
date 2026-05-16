# Plan de Implementación: Mapa Interactivo de Centros de Bienestar

Este plan detalla la creación de un widget de mapa interactivo para Webflow que muestra las ubicaciones de los Centros de Bienestar aprobados en México.

## Cambios Propuestos

### Backend (Servicios y API)

1.  **[MODIFY] [wellness.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/wellness.service.ts)**:
    *   Añadir método `getAllApprovedLocations()` para obtener los centros con estado `approved` y que tengan coordenadas (`lat` y `lng`).
2.  **[NEW] [locations/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/wellness/locations/route.ts)**:
    *   Crear endpoint `GET /api/wellness/locations` que exponga los datos necesarios para el mapa.

### Frontend (Widget para Webflow)

1.  **[NEW] [wellness-map-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-map-widget.js)**:
    *   Implementar widget autoinyectable.
    *   Uso de Leaflet.js para renderizado de mapa.
    *   Capa de mapa personalizada (estilo premium).
    *   Popups interactivos al hacer hover/click con los datos del centro (nombre, logo, servicios, dirección).

## Plan de Verificación

1.  **Backend**:
    *   Verificar que `/api/wellness/locations` retorna solo centros aprobados con coordenadas.
2.  **Frontend**:
    *   Probar el widget en una página HTML local simulando el entorno de Webflow.
    *   Verificar que los puntos se posicionan correctamente en el mapa de México.
    *   Validar la visualización de los popups.

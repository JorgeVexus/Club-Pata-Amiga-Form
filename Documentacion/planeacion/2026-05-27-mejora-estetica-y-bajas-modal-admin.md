# Plan de Implementación: Ensanchamiento de Modal y Agrupación de Bajas de Mascotas

Este plan propone ensanchar el modal de detalles de miembro en el dashboard del administrador para mejorar la legibilidad y legar un diseño más premium, así como agrupar las mascotas dadas de baja bajo una sección colapsable (dropdown) para destacar siempre primero a las mascotas activas o pendientes.

## Cambios Propuestos

### 1. Interfaz y Estilos del Modal
#### [MODIFY] [MemberDetailModal.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.module.css)
* Incrementar el ancho máximo de la clase `.modal` de `800px` a `1100px` para aprovechar mejor el espacio horizontal sin exagerar.
* Agregar clases CSS para la sección de bajas colapsable: `.unsubscribedSection`, `.unsubscribedHeader`, `.unsubscribedTitle`, `.unsubscribedIcon`, `.unsubscribedIconRotated`, y `.unsubscribedGrid`.

### 2. Lógica del Componente Modal
#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)
* Introducir un estado de React `showUnsubscribedPets` (booleano) inicializado en `false`.
* Dividir el listado de `pets` en dos arreglos:
  - `activePets`: mascotas que no están dadas de baja (`pet.is_active !== false && pet.status !== 'unsubscribed'`).
  - `unsubscribedPets`: mascotas inactivas (`pet.is_active === false || pet.status === 'unsubscribed'`).
* Si `selectedPetId` está activo (por ejemplo, en el flujo de apelación individual), mantendremos el comportamiento de visualización única correspondiente.
* Renderizar las `activePets` de manera directa en el grid principal de mascotas.
* Si hay `unsubscribedPets`, mostrarlas dentro de un contenedor colapsable con un botón/encabezado interactivo que rota un icono de flecha al expandirse/colapsarse.

---

## Plan de Verificación

### Pruebas de Calidad Automatizadas
- Ejecutar `npm run type-check` y `npm run lint`.
- Verificar que la compilación funcione mediante `npm run build`.

### Pruebas Manuales
- Abrir el panel de administración de manera local.
- Inspeccionar el modal de detalles de miembros (por ejemplo, de Lucero Contreras) para confirmar que se ve más ancho, con un espaciado equilibrado.
- Confirmar que las mascotas dadas de baja (ej. Felipe1) no se muestran por defecto, sino que están agrupadas en la sección "Mascotas Dadas de Baja".
- Hacer clic en la sección de bajas para confirmar que se despliega correctamente mostrando sus tarjetas asociadas.

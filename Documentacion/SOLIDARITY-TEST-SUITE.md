# 🧪 Plan de Pruebas: Fondo Solidario

Este plan detalla los pasos para verificar el flujo completo del sistema, desde la creación de la solicitud hasta la resolución administrativa.

---

## 🏗️ Preparación del Entorno
Para realizar pruebas efectivas, necesitas una mascota que haya cumplido su período de carencia. 

### Modificación Manual de Carencia (SQL)
Ejecuta esto en el editor SQL de Supabase para activar una mascota inmediatamente:
```sql
-- Reemplaza 'PET_NAME' y 'MEMBER_ID' con tus datos
UPDATE pets 
SET waiting_period_end = NOW() - INTERVAL '1 day' 
WHERE name = 'PET_NAME' 
AND memberstack_id = 'MEMBER_ID';
```

---

## 🧪 Casos de Prueba (E2E)

### 1. Visualización y Elegibilidad (Dashboard)
- [ ] Entrar al dashboard de Manada.
- [ ] Verificar que la mascota activada aparece con el estado "Activa" (o sin el overlay de carencia).
- [ ] Verificar que el botón "Nueva Solicitud" redirige correctamente a `/solicitar-apoyo`.
- [ ] Verificar que las mascotas aún en carencia muestran el tooltip informativo y no son seleccionables.

### 2. Formulario de Solicitud (Usuario)
- [ ] Seleccionar la mascota activa.
- [ ] Elegir "Reembolso".
- [ ] Seleccionar "Emergencia Médica".
- [ ] Intentar ingresar un monto mayor a $3,000 (Verificar bloqueo/alerta).
- [ ] Completar descripción y datos de la clínica.
- [ ] Subir los 3 archivos requeridos (Imagen/PDF).
- [ ] Enviar y verificar que aparezca el Folio `SF-YYYY-NNNN`.
- [ ] Hacer clic en "Ver mi solicitud" y verificar que cargue el detalle.

### 3. Gestión Administrativa (Admin)
- [ ] Entrar al Dashboard Admin -> Sección Fondo Solidario.
- [ ] Localizar la nueva solicitud en la pestaña "Nuevas".
- [ ] Abrir el detalle y verificar que la información de la mascota y los documentos carguen correctamente.
- [ ] **Acción: Pedir más información**.
  - [ ] Escribir un mensaje en el chat.
  - [ ] Verificar que el estado cambie a "Info Pendiente".
- [ ] **Acción: Aprobar**.
  - [ ] Ajustar el monto aprobado (ej. de $3,000 a $2,500).
  - [ ] Confirmar aprobación.
  - [ ] Verificar que el estado cambie a "Aprobada".

### 4. Seguimiento y Chat (Usuario)
- [ ] Como usuario, entrar a la campana de notificaciones.
- [ ] Verificar que llegó la notificación de "Solicitud de Información".
- [ ] Hacer clic y verificar que abra el chat en el detalle de la solicitud.
- [ ] Responder al admin y verificar que la respuesta llegue al panel admin.

### 5. Liquidación (Finanzas)
- [ ] Verificar que la solicitud aprobada aparezca en el historial financiero con el monto aprobado final.

---

## 🚨 Verificaciones de Seguridad
- [ ] Intentar acceder a `/api/solidarity/details/[ID]` con un usuario que NO es el dueño de la mascota (Debe retornar 403/404).
- [ ] Intentar subir un archivo que no sea imagen o PDF (Debe ser rechazado por la API).

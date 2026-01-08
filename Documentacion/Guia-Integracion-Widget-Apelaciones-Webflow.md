# 🎡 Guía de Integración: Smart Membership Widget (Todo en Uno)

Este nuevo widget unifica el panel de **Período de Carencia** con el **Sistema de Apelaciones**. Se adapta automáticamente al estado de cada mascota (Aprobada, Rechazada, Acción Requerida o Pendiente).

---

## 1. Crear el Contenedor
Agrega un elemento **Embed** en tu página de Dashboard de Webflow:

```html
<!-- Contenedor único para todas las mascotas -->
<div id="pata-amiga-membership-widget"></div>
```

---

## 2. Agregar el Script Unificado
Puedes colocarlo en el mismo Embed o en los Config de la página (`Before </body> tag`).

```html
<script>
  window.PATA_AMIGA_CONFIG = {
    apiUrl: 'https://club-pata-amiga-form.vercel.app'
  };
</script>
<script src="https://club-pata-amiga-form.vercel.app/widgets/unified-membership-widget.js"></script>
```

---

## 🚀 Características de esta versión:

1.  **Interfaz de Pestañas (Tabs):** Si el usuario tiene varias mascotas, puede alternar entre ellas para ver su estado individual.
2.  **Carencia Visual:** Para mascotas aprobadas, muestra la barra de progreso con el perrito animado y los días restantes (basado en tu diseño original).
3.  **Apelación "Click-to-Reveal":** 
    -   Si una mascota es rechazada, solo aparece el botón **"Apelar mi solicitud"**.
    -   Al dar clic, se despliega suavemente el formulario para escribir el mensaje. Esto mantiene el diseño limpio.
4.  **Notas del Admin:** Muestra directamente las razones del rechazo o las instrucciones de "Acción Requerida".

---

## 💡 Notas Técnicas
- **ID del Contenedor:** Asegúrate de que el ID del div sea exactamente `pata-amiga-membership-widget`.
- **Estilos:** El widget ya inyecta su propio CSS (basado en tus colores `--panel-bg: #00BBB4`, etc.) para que no tengas que añadir nada extra.

¿Alguna duda con la implementación? ¡Pruébalo y verás lo potente que queda! 🐾⚖️✨

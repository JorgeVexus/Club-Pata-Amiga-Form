# 🎡 Guía de Integración: Widget de Apelaciones en Webflow

Para integrar el sistema de apelaciones y el visor de estado de mascotas en Webflow, debes seguir estos dos pasos sencillos.

---

## 1. Crear el Contenedor (Place Holder)
En la página de Webflow donde quieras que aparezca el widget (ej. Dashboard de Usuario), agrega un elemento **Embed** de Webflow y pega el siguiente código HTML:

```html
<!-- Contenedor donde se renderizará el widget -->
<div id="pata-amiga-appeal-widget"></div>
```

---

## 2. Agregar el Script de Lógica
Puedes agregarlo en la misma sección de **Embed** (debajo del div anterior) o en los **Page Settings** (en el apartado de `Before </body> tag`).

```html
<script>
  window.PATA_AMIGA_CONFIG = {
    apiUrl: 'https://club-pata-amiga-form.vercel.app'
  };
</script>
<script src="https://club-pata-amiga-form.vercel.app/widgets/appeal-widget.js"></script>
```

---

## 💡 Notas Importantes

### Dependencia de Memberstack
El widget detecta automáticamente al usuario logueado usando Memberstack. Asegúrate de que:
1. Memberstack esté correctamente configurado en la página.
2. El usuario haya iniciado sesión antes de cargar el widget.

### ¿Qué hace el widget exactamente?
- **Si el usuario está Aprobado:** Muestra un banner de bienvenida y la lista de sus mascotas activas.
- **Si está Rechazado:** Muestra el motivo y el formulario para enviar la apelación.
- **Si está En Apelación:** Muestra un mensaje de "En revisión" para darle tranquilidad al usuario.
- **Si falta información:** Listará las mascotas que requieren atención específica.

### Estilos
El widget ya incluye sus propios estilos (colores, fuentes y sombras) para que se vea moderno y profesional de inmediato, adaptándose al diseño de Club Pata Amiga.

---

¿Necesitas ayuda con alguna personalización visual o algún paso adicional?

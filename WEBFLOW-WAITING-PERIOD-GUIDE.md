# Guía de Integración: Panel de Período de Carencia en Webflow

Esta guía te ayudará a integrar el panel dinámico de período de carencia en tu sitio de Webflow.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Crear la Página de Dashboard](#paso-1-crear-la-página-de-dashboard)
3. [Paso 2: Configurar Memberstack Gating](#paso-2-configurar-memberstack-gating)
4. [Paso 3: Agregar el HTML del Panel](#paso-3-agregar-el-html-del-panel)
5. [Paso 4: Agregar los Estilos CSS](#paso-4-agregar-los-estilos-css)
6. [Paso 5: Agregar el JavaScript](#paso-5-agregar-el-javascript)
7. [Paso 6: Publicar y Probar](#paso-6-publicar-y-probar)
8. [Personalización](#personalización)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de Webflow con acceso al proyecto
- ✅ Memberstack v2 instalado y configurado
- ✅ Usuarios registrados con mascotas en Memberstack
- ✅ Custom fields de Memberstack configurados (ver [MEMBERSTACK-FIELDS.md](MEMBERSTACK-FIELDS.md))

### Custom Fields Requeridos

El panel utiliza los siguientes custom fields de Memberstack:

**Por cada mascota (X = 1, 2, 3):**
- `pet-X-name` - Nombre de la mascota
- `pet-X-last-name` - Apellido de la mascota
- `pet-X-waiting-period-days` - Días totales del período (120 o 180)
- `pet-X-waiting-period-end` - Fecha de fin (formato ISO)
- `pet-X-registration-date` - Fecha de registro (formato ISO)
- `pet-X-is-active` - Si la mascota está activa ("true" o "false")
- `pet-X-is-adopted` - Si fue adoptada ("true" o "false")
- `pet-X-ruac` - Código RUAC (opcional)

**General:**
- `total-pets` - Número total de mascotas registradas

---

## Paso 1: Crear la Página de Dashboard

1. **Crear nueva página en Webflow:**
   - Ve a **Pages** → **Add Page**
   - Nombre: `dashboard` o `mi-cuenta`
   - URL: `/dashboard` o `/mi-cuenta`

2. **Configurar el layout:**
   - Agrega un **Container** para centrar el contenido
   - Establece max-width: `1200px`
   - Padding: `40px 20px`

---

## Paso 2: Configurar Memberstack Gating

1. **Proteger la página:**
   - Selecciona la página en el panel de Pages
   - En **Page Settings** → **Memberstack**
   - Activa **Gate this page**
   - Selecciona los planes que pueden acceder

2. **Agregar script de Memberstack:**
   - Ve a **Project Settings** → **Custom Code**
   - En **Head Code**, asegúrate de tener:

```html
<script data-memberstack-app="YOUR_APP_ID" src="https://static.memberstack.com/scripts/v1/memberstack.js?custom" type="text/javascript"></script>
```

---

## Paso 3: Agregar el HTML del Panel

1. **Agregar HTML Embed:**
   - Arrastra un elemento **Embed** al Container
   - Copia el contenido de `waiting-period-panel.html`
   - **IMPORTANTE:** Solo copia el contenido dentro de `<body>`, excluyendo las etiquetas `<html>`, `<head>`, y `<body>`

2. **Código HTML a copiar:**

```html
<!-- Panel de Período de Carencia -->
<div class="waiting-period-panel" id="waitingPeriodPanel">
    <!-- Mensaje de bienvenida -->
    <div class="panel-header">
        <p class="welcome-message">
            Nos encanta tenerte aquí. Mientras termina tu período de carencia, sigue explorando lo que Pata Amiga tiene para ti.
        </p>
    </div>

    <!-- Contenedor principal del panel -->
    <div class="panel-content">
        <!-- Título y progreso -->
        <div class="period-info">
            <h2 class="period-title">Tu período de carencia</h2>
            
            <!-- Mensaje motivacional -->
            <p class="motivational-message" data-pet-info="motivational">
                ¡Ya recorriste más de la mitad del camino!
            </p>

            <!-- Información de días restantes -->
            <p class="days-info" data-pet-info="days-text">
                Faltan <span data-pet-info="days-remaining">53</span> días para activar tu fondo solidario completo
            </p>

            <!-- Barra de progreso -->
            <div class="progress-container">
                <div class="progress-labels">
                    <span class="progress-label-start">Día 1</span>
                    <span class="progress-percentage" data-pet-info="percentage">46% completado</span>
                    <span class="progress-label-end" data-pet-info="total-days">Día 180</span>
                </div>
                
                <div class="progress-bar-wrapper">
                    <div class="progress-bar" data-pet-info="progress-bar" style="width: 46%;">
                        <!-- Imagen del perrito animado -->
                        <img 
                            src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" 
                            alt="Perrito" 
                            class="progress-dog"
                        >
                    </div>
                </div>
            </div>

            <!-- Icono de reloj -->
            <div class="clock-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#FF6B35" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="#FF6B35" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
        </div>

        <!-- Contador de días restantes -->
        <div class="countdown-box">
            <p class="countdown-label">Tiempo restante</p>
            <div class="countdown-number" data-pet-info="countdown">53</div>
            <p class="countdown-unit">Días</p>
        </div>
    </div>

    <!-- Información adicional / RUAC -->
    <div class="additional-info">
        <div class="info-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#FF8C42" stroke-width="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="#FF8C42" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="info-text">
            <p data-pet-info="additional-message">
                ¿Adoptaste a alguno de tus compañeros o tienes RUAC? Puedes acelerar tu acceso al fondo. Contáctanos para validar tus documentos.
            </p>
        </div>
    </div>

    <!-- Navegación entre mascotas -->
    <div class="pet-navigation" id="petNavigation" style="display: none;">
        <button class="pet-nav-btn active" data-pet-index="0">
            <span class="pet-icon">🐕</span>
            <span class="pet-name" data-pet-info="nav-name-1">Mascota 1</span>
        </button>
        <button class="pet-nav-btn" data-pet-index="1">
            <span class="pet-icon">🐕</span>
            <span class="pet-name" data-pet-info="nav-name-2">Mascota 2</span>
        </button>
        <button class="pet-nav-btn" data-pet-index="2">
            <span class="pet-icon">🐕</span>
            <span class="pet-name" data-pet-info="nav-name-3">Mascota 3</span>
        </button>
    </div>

    <!-- Mensaje de carga -->
    <div class="loading-message" id="loadingMessage">
        <p>Cargando información de tu mascota...</p>
    </div>

    <!-- Mensaje de error -->
    <div class="error-message" id="errorMessage" style="display: none;">
        <p>No se pudo cargar la información. Por favor, recarga la página.</p>
    </div>
</div>
```

---

## Paso 4: Agregar los Estilos CSS

1. **Abrir Page Settings:**
   - Selecciona la página del dashboard
   - Click en el ícono de configuración (⚙️)
   - Ve a la pestaña **Custom Code**

2. **Agregar CSS en "Before </head> tag":**

```html
<style>
/* Copia aquí el contenido completo de waiting-period-panel.css */
</style>
```

> **Nota:** Copia todo el contenido del archivo `waiting-period-panel.css` dentro de las etiquetas `<style>`.

---

## Paso 5: Agregar el JavaScript

1. **Agregar JavaScript en "Before </body> tag":**

```html
<script>
// Copia aquí el contenido completo de waiting-period-panel.js
</script>
```

> **Nota:** Copia todo el contenido del archivo `waiting-period-panel.js` dentro de las etiquetas `<script>`.

---

## Paso 6: Publicar y Probar

1. **Guardar cambios:**
   - Click en **Save** en Webflow Designer

2. **Publicar el sitio:**
   - Click en **Publish** (esquina superior derecha)
   - Selecciona el dominio de staging o producción

3. **Probar la funcionalidad:**
   - Abre el sitio publicado en una ventana de incógnito
   - Inicia sesión con un usuario que tenga mascotas registradas
   - Navega a `/dashboard`
   - Verifica que:
     - ✅ Se carga la información correctamente
     - ✅ La barra de progreso muestra el porcentaje correcto
     - ✅ El contador de días es preciso
     - ✅ Si hay múltiples mascotas, aparecen los botones de navegación
     - ✅ Al cambiar de mascota, se actualiza la información

---

## Personalización

### Cambiar Colores

Edita las variables CSS en la parte superior del archivo CSS:

```css
:root {
    --panel-bg: #00BBB4;        /* Fondo del panel */
    --progress-green: #9fd406;  /* Color de la barra de progreso */
    --countdown-bg: #C8E600;    /* Fondo del contador */
    --text-dark: #1A1A1A;       /* Texto oscuro */
    --text-white: #FFFFFF;      /* Texto blanco */
}
```

### Cambiar Textos

Puedes modificar los textos directamente en el HTML Embed:

- **Mensaje de bienvenida:** Edita el contenido de `.welcome-message`
- **Título:** Edita `<h2 class="period-title">`
- **Mensajes motivacionales:** Se generan dinámicamente en JavaScript (función `updateMotivationalMessage`)

### Cambiar la Imagen del Perrito

Reemplaza la URL en el atributo `src` de la imagen:

```html
<img 
    src="TU_NUEVA_URL_AQUI" 
    alt="Perrito" 
    class="progress-dog"
>
```

---

## Troubleshooting

### ❌ No se carga ninguna información

**Posibles causas:**
1. Memberstack no está cargado
2. El usuario no está autenticado
3. No hay custom fields configurados

**Solución:**
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que Memberstack esté instalado: `window.$memberstackDom` debe existir
- Verifica que el usuario tenga datos: revisa en Memberstack Dashboard

### ❌ La barra de progreso no se muestra correctamente

**Posibles causas:**
1. Falta el campo `pet-X-waiting-period-end`
2. Falta el campo `pet-X-registration-date`
3. Las fechas están en formato incorrecto

**Solución:**
- Las fechas deben estar en formato ISO: `2024-12-10T00:00:00.000Z`
- Verifica en Memberstack Dashboard que los campos existen

### ❌ No aparecen los botones de navegación entre mascotas

**Posibles causas:**
1. Solo hay 1 mascota registrada
2. El campo `total-pets` no está configurado

**Solución:**
- Los botones solo aparecen si hay 2 o más mascotas
- Verifica que `total-pets` tenga el valor correcto

### ❌ El diseño no se ve responsive en móvil

**Posibles causas:**
1. Falta la etiqueta viewport en el head
2. Hay estilos de Webflow que interfieren

**Solución:**
- Asegúrate de que el sitio tenga: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Revisa que no haya estilos de Webflow con `!important` que sobrescriban los del panel

---

## Archivos de Referencia

- **HTML:** `waiting-period-panel.html`
- **CSS:** `waiting-period-panel.css`
- **JavaScript:** `waiting-period-panel.js`
- **Custom Fields:** `MEMBERSTACK-FIELDS.md`

---

## Soporte

Si tienes problemas con la integración:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que todos los custom fields estén configurados
3. Asegúrate de que Memberstack v2 esté correctamente instalado
4. Prueba con un usuario de prueba que tenga datos completos

---

## Notas Importantes

> **⚠️ IMPORTANTE:** Este panel NO modifica el formulario `pet-membership-form`. Solo lee los datos ya almacenados en Memberstack.

> **💡 TIP:** Puedes agregar este panel a cualquier página protegida de Webflow, no solo al dashboard.

> **🎨 DISEÑO:** El panel es completamente responsive y se adapta a todos los tamaños de pantalla (desktop, tablet, móvil).

---

¡Listo! Tu panel de período de carencia está integrado y funcionando. 🎉

# Dashboard de Usuario en Webflow - Guía Completa

Guía paso a paso para crear un dashboard de usuario completamente nativo en Webflow usando Memberstack para mostrar información del usuario y sus mascotas.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Estructura de la Página](#estructura-de-la-página)
3. [Sección: Información del Usuario](#sección-información-del-usuario)
4. [Sección: Mascotas del Usuario](#sección-mascotas-del-usuario)
5. [Modal: Detalles de Mascota](#modal-detalles-de-mascota)
6. [JavaScript Personalizado](#javascript-personalizado)
7. [Estilos CSS](#estilos-css)
8. [Configuración de Memberstack](#configuración-de-memberstack)

---

## 🔧 Configuración Inicial

### 1. Crear Página en Webflow

1. En Webflow, crea una nueva página llamada **"Dashboard"** o **"Mi Cuenta"**
2. En **Page Settings → Access**, marca como **"Members Only"**
3. Configura el redirect para usuarios no autenticados a `/login`

### 2. Instalar Memberstack

Asegúrate de que Memberstack esté instalado en tu proyecto:
- Ve a **Project Settings → Custom Code**
- En **Head Code**, debe estar el script de Memberstack

---

## 🏗️ Estructura de la Página

### Layout Principal

```
📄 Dashboard Page
  └── 🔲 Container (max-width: 1200px)
      ├── 📌 Header Section
      ├── 📌 User Info Section
      ├── 📌 Pets Section
      │   ├── Pet Card 1
      │   ├── Pet Card 2
      │   └── Pet Card 3
      └── 📌 History Section (opcional)
```

### Crear Container Principal

1. Agrega un **Container** (o **Div Block**)
2. **Atributos**:
   - Class: `dashboard-container`
3. **Estilos**:
   - Max Width: `1200px`
   - Margin: `0 auto`
   - Padding: `40px 20px`

---

## 👤 Sección: Información del Usuario

### Estructura HTML

```
🔲 Div Block (user-info-section)
  ├── 🔲 Div Block (user-info-header)
  │   ├── 📝 Heading (h2): "Mi Información"
  │   └── 🔲 Div Block (user-status-badge)
  │       └── 📝 Text: "Cuenta Activa ✅"
  │
  └── 🔲 Div Block (user-info-grid)
      ├── 🔲 Div Block (info-item) × 6
      │   ├── 📝 Text (label): "Nombre completo"
      │   └── 📝 Text (value): [Memberstack attribute]
```

### Paso a Paso

#### 1. Crear Sección Principal

1. Agrega **Div Block**
2. **Atributos**:
   - Class: `user-info-section`
3. **Estilos**:
   - Background: `#FFFFFF`
   - Border Radius: `50px`
   - Padding: `32px`
   - Box Shadow: `0 2px 10px rgba(0,0,0,0.1)`
   - Margin Bottom: `32px`

#### 2. Crear Header

Dentro de `user-info-section`:

1. Agrega **Div Block** → Class: `user-info-header`
2. Dentro, agrega **Heading (H2)** → Texto: "Mi Información"
3. Agrega **Div Block** → Class: `user-status-badge`
4. Dentro del badge, agrega **Text** → Texto: "✅ Cuenta Activa"

**Estilos del header**:
- Display: `Flex`
- Justify: `Space between`
- Align: `Center`
- Padding Bottom: `16px`
- Border Bottom: `2px solid #f0f0f0`
- Margin Bottom: `24px`

**Estilos del badge**:
- Background: `#d4edda`
- Color: `#155724`
- Padding: `8px 16px`
- Border Radius: `25px`
- Font Weight: `600`

#### 3. Crear Grid de Información

Dentro de `user-info-section`:

1. Agrega **Div Block** → Class: `user-info-grid`
2. **Estilos**:
   - Display: `Grid`
   - Grid Template Columns: `repeat(2, 1fr)` (2 columnas)
   - Gap: `24px`

#### 4. Crear Items de Información (×6)

Para cada campo (nombre, email, teléfono, dirección, fecha registro, período carencia):

1. Agrega **Div Block** → Class: `info-item`
2. Dentro, agrega **Text** → Class: `info-label`
3. Agrega otro **Text** → Class: `info-value`

**Atributos de Memberstack** para los valores:

| Campo | Atributo Memberstack |
|-------|---------------------|
| Nombre completo | `data-ms-member="first-name"` + `data-ms-member="paternal-last-name"` |
| Email | `data-ms-member="email"` |
| Teléfono | `data-ms-member="phone"` |
| Dirección | `data-ms-member="address"` |
| Fecha de registro | `data-ms-member="registration-date"` |
| Período de carencia | `data-ms-member="waiting-period-end"` |

**Ejemplo de un item**:

```html
<div class="info-item">
  <div class="info-label">Nombre completo</div>
  <div class="info-value">
    <span data-ms-member="first-name"></span>
    <span data-ms-member="paternal-last-name"></span>
    <span data-ms-member="maternal-last-name"></span>
  </div>
</div>
```

**Estilos**:
- `.info-label`: Color `#666`, Font Size `14px`, Font Weight `500`
- `.info-value`: Color `#333`, Font Size `18px`, Font Weight `600`

---

## 🐾 Sección: Mascotas del Usuario

### Estructura HTML

```
🔲 Div Block (pets-section)
  ├── 🔲 Div Block (pets-header)
  │   ├── 📝 Heading (h2): "Mis Mascotas"
  │   └── 🔲 Div Block (pets-count): "X de 3 activas"
  │
  └── 🔲 Div Block (pets-grid)
      ├── 🔲 Div Block (pet-card-1)
      ├── 🔲 Div Block (pet-card-2)
      └── 🔲 Div Block (pet-card-3)
```

### Paso a Paso

#### 1. Crear Sección de Mascotas

1. Agrega **Div Block** → Class: `pets-section`
2. **Estilos**: (iguales a `user-info-section`)

#### 2. Crear Header de Mascotas

1. Agrega **Div Block** → Class: `pets-header`
2. Dentro, agrega **Heading (H2)** → Texto: "Mis Mascotas"
3. Agrega **Div Block** → Class: `pets-count`
4. Dentro, agrega **Text** → Texto: "0 de 3 activas" (se actualizará con JS)

#### 3. Crear Grid de Mascotas

1. Agrega **Div Block** → Class: `pets-grid`
2. **Estilos**:
   - Display: `Grid`
   - Grid Template Columns: `repeat(auto-fill, minmax(320px, 1fr))`
   - Gap: `24px`

#### 4. Crear Tarjeta de Mascota (×3)

Para cada mascota (pet-1, pet-2, pet-3):

##### Estructura de Pet Card

```
🔲 Div Block (pet-card)
  ├── 🔲 Div Block (pet-card-header)
  │   ├── 🖼️ Image (pet-photo)
  │   └── 🔲 Div Block (pet-basic-info)
  │       ├── 📝 Heading (h3): Nombre de mascota
  │       ├── 📝 Text: Raza
  │       └── 📝 Text: Edad
  │
  ├── 🔲 Div Block (pet-card-body)
  │   ├── 🔲 Div Block (waiting-period-indicator)
  │   │   ├── 📝 Text: "⏳ Período de carencia"
  │   │   ├── 🔲 Div Block (progress-bar)
  │   │   └── 📝 Text: "X días restantes"
  │   │
  │   └── 🔲 Div Block (pet-badges)
  │       └── 🏷️ Badge: "💚 Adoptada"
  │
  └── 🔲 Div Block (pet-card-actions)
      ├── 🔘 Button: "Ver detalles"
      └── 🔘 Button: "Reemplazar"
```

##### Paso a Paso para Pet Card 1

1. **Crear contenedor de la tarjeta**:
   - Agrega **Div Block** → Class: `pet-card`
   - Atributo: `data-pet-position="1"`
   - **Estilos**:
     - Background: `#f9f9f9`
     - Border Radius: `30px`
     - Padding: `24px`
     - Box Shadow: `0 2px 8px rgba(0,0,0,0.08)`

2. **Crear header de la tarjeta**:
   - Agrega **Div Block** → Class: `pet-card-header`
   - **Estilos**: Display `Flex`, Gap `16px`

3. **Agregar foto de mascota**:
   - Agrega **Image** → Class: `pet-photo`
   - Atributo Memberstack: `data-ms-member="pet-1-photo-1-url"`
   - **Estilos**:
     - Width: `80px`
     - Height: `80px`
     - Border Radius: `50%`
     - Object Fit: `Cover`

4. **Agregar información básica**:
   - Agrega **Div Block** → Class: `pet-basic-info`
   - Dentro, agrega **Heading (H3)** → Class: `pet-name`
     - Atributo: `data-ms-member="pet-1-name"`
   - Agrega **Text** → Class: `pet-breed`
     - Atributo: `data-ms-member="pet-1-breed"`
   - Agrega **Text** → Class: `pet-age`
     - Atributo: `data-ms-member="pet-1-age"`

5. **Crear indicador de período de carencia**:
   - Agrega **Div Block** → Class: `waiting-period-indicator`
   - Atributo: `data-pet-id="1"`
   - Dentro:
     - **Text**: "⏳ Período de carencia"
     - **Div Block** → Class: `progress-bar-container`
       - Dentro: **Div Block** → Class: `progress-bar-fill`
     - **Text** → Class: `remaining-days`: "Calculando..."

6. **Agregar badges** (opcional):
   - Agrega **Div Block** → Class: `pet-badges`
   - Dentro, agrega **Div Block** → Class: `badge badge-adopted`
     - Atributo: `data-ms-member="pet-1-is-adopted"`
     - Texto: "💚 Adoptada"

7. **Agregar botones de acción**:
   - Agrega **Div Block** → Class: `pet-card-actions`
   - Dentro:
     - **Button** → Class: `btn-secondary`
       - Texto: "Ver detalles"
       - Atributo: `data-action="view-details"` `data-pet-id="1"`
     - **Button** → Class: `btn-replace`
       - Texto: "Reemplazar"
       - Atributo: `data-action="replace-pet"` `data-pet-id="1"`

**Repite este proceso para pet-2 y pet-3**, cambiando:
- `data-pet-position="2"` y `data-pet-position="3"`
- `data-ms-member="pet-2-*"` y `data-ms-member="pet-3-*"`
- `data-pet-id="2"` y `data-pet-id="3"`

---

## 🔍 Modal: Detalles de Mascota

### Estructura HTML

```
🔲 Div Block (modal-overlay) [hidden por defecto]
  └── 🔲 Div Block (modal-content)
      ├── 🔲 Div Block (modal-header)
      │   ├── 📝 Heading (h2): "Detalles de [Nombre]"
      │   └── 🔘 Button (close): "✕"
      │
      ├── 🔲 Div Block (modal-body)
      │   ├── 🔲 Div Block (pet-photos-grid)
      │   │   ├── 🖼️ Image: Foto 1
      │   │   └── 🖼️ Image: Foto 2
      │   │
      │   └── 🔲 Div Block (details-grid)
      │       └── [Info items]
      │
      └── 🔲 Div Block (modal-footer)
          └── 🔘 Button: "Cerrar"
```

### Paso a Paso

1. **Crear overlay del modal**:
   - Agrega **Div Block** → Class: `modal-overlay`
   - Atributo: `id="pet-details-modal"` `style="display: none;"`
   - **Estilos**:
     - Position: `Fixed`
     - Top/Left/Right/Bottom: `0`
     - Background: `rgba(0,0,0,0.6)`
     - Z-index: `1000`
     - Display: `Flex`
     - Align Items: `Center`
     - Justify Content: `Center`

2. **Crear contenido del modal**:
   - Dentro del overlay, agrega **Div Block** → Class: `modal-content`
   - **Estilos**:
     - Background: `#FFFFFF`
     - Border Radius: `30px`
     - Max Width: `600px`
     - Width: `90%`
     - Max Height: `90vh`
     - Overflow Y: `Auto`
     - Box Shadow: `0 10px 40px rgba(0,0,0,0.2)`

3. **Crear header del modal**:
   - Agrega **Div Block** → Class: `modal-header`
   - Dentro:
     - **Heading (H2)** → Class: `modal-title`: "Detalles de Mascota"
     - **Button** → Class: `modal-close`
       - Texto: "✕"
       - Atributo: `data-action="close-modal"`

4. **Crear body del modal**:
   - Agrega **Div Block** → Class: `modal-body`
   - Dentro, agrega **Div Block** → Class: `pet-photos-grid`
     - **Image** → Atributo: `data-ms-member="pet-1-photo-1-url"`
     - **Image** → Atributo: `data-ms-member="pet-1-photo-2-url"`
   - Agrega **Div Block** → Class: `details-grid`
     - Crea múltiples `info-item` con todos los detalles de la mascota

5. **Crear footer del modal**:
   - Agrega **Div Block** → Class: `modal-footer`
   - Dentro, agrega **Button** → Class: `btn-primary`
     - Texto: "Cerrar"
     - Atributo: `data-action="close-modal"`

---

## 💻 JavaScript Personalizado

Agrega este código en **Page Settings → Custom Code → Before </body> tag**:

```html
<script>
// Esperar a que Memberstack se cargue
document.addEventListener('DOMContentLoaded', function() {
  
  // Función para calcular días restantes
  function calculateDaysRemaining(endDateStr) {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
  
  // Función para formatear días restantes
  function formatRemainingTime(days) {
    if (days <= 0) return 'Activa';
    if (days === 1) return '1 día restante';
    if (days < 30) return days + ' días restantes';
    
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    
    if (months === 1) {
      return remainingDays > 0 ? '1 mes y ' + remainingDays + ' días' : '1 mes';
    }
    
    return remainingDays > 0 
      ? months + ' meses y ' + remainingDays + ' días'
      : months + ' meses';
  }
  
  // Función para actualizar el progreso de carencia
  function updateWaitingPeriod(petId) {
    const indicator = document.querySelector('[data-pet-id="' + petId + '"]');
    if (!indicator) return;
    
    // Obtener datos de Memberstack
    if (window.$memberstackDom) {
      window.$memberstackDom.getCurrentMember().then(function(member) {
        if (!member || !member.data) return;
        
        const customFields = member.data.customFields || {};
        const endDate = customFields['pet-' + petId + '-waiting-period-end'];
        const registrationDate = customFields['pet-' + petId + '-registration-date'];
        const isActive = customFields['pet-' + petId + '-is-active'];
        
        // Si la mascota no está activa, ocultar la tarjeta
        if (isActive === 'false') {
          const card = document.querySelector('[data-pet-position="' + petId + '"]');
          if (card) card.style.display = 'none';
          return;
        }
        
        const daysRemaining = calculateDaysRemaining(endDate);
        
        // Actualizar texto de días restantes
        const remainingText = indicator.querySelector('.remaining-days');
        if (remainingText) {
          remainingText.textContent = formatRemainingTime(daysRemaining);
        }
        
        // Actualizar barra de progreso
        if (registrationDate && endDate) {
          const start = new Date(registrationDate);
          const end = new Date(endDate);
          const today = new Date();
          
          const totalDuration = end - start;
          const elapsed = today - start;
          const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
          
          const progressBar = indicator.querySelector('.progress-bar-fill');
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
        }
        
        // Cambiar estilo si ya está activa
        if (daysRemaining <= 0) {
          indicator.classList.add('active');
          indicator.classList.remove('waiting');
        }
      });
    }
  }
  
  // Función para mostrar/ocultar badges
  function updatePetBadges(petId) {
    if (!window.$memberstackDom) return;
    
    window.$memberstackDom.getCurrentMember().then(function(member) {
      if (!member || !member.data) return;
      
      const customFields = member.data.customFields || {};
      const isAdopted = customFields['pet-' + petId + '-is-adopted'];
      
      // Mostrar/ocultar badge de adoptada
      const adoptedBadge = document.querySelector('[data-pet-id="' + petId + '"] .badge-adopted');
      if (adoptedBadge) {
        adoptedBadge.style.display = isAdopted === 'true' ? 'inline-block' : 'none';
      }
      
    });
  }
  
  // Función para contar mascotas activas
  function updatePetsCount() {
    if (!window.$memberstackDom) return;
    
    window.$memberstackDom.getCurrentMember().then(function(member) {
      if (!member || !member.data) return;
      
      const customFields = member.data.customFields || {};
      let activeCount = 0;
      
      for (let i = 1; i <= 3; i++) {
        const isActive = customFields['pet-' + i + '-is-active'];
        const hasName = customFields['pet-' + i + '-name'];
        if (isActive !== 'false' && hasName) {
          activeCount++;
        }
      }
      
      const countElement = document.querySelector('.pets-count');
      if (countElement) {
        countElement.textContent = activeCount + ' de 3 activas';
      }
    });
  }
  
  // Función para abrir modal de detalles
  function openDetailsModal(petId) {
    const modal = document.getElementById('pet-details-modal');
    if (!modal) return;
    
    // Cargar datos de la mascota en el modal
    if (window.$memberstackDom) {
      window.$memberstackDom.getCurrentMember().then(function(member) {
        if (!member || !member.data) return;
        
        const customFields = member.data.customFields || {};
        const petName = customFields['pet-' + petId + '-name'];
        
        // Actualizar título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
          modalTitle.textContent = 'Detalles de ' + petName;
        }
        
        // Actualizar imágenes
        const photo1 = modal.querySelector('[data-ms-member="pet-1-photo-1-url"]');
        const photo2 = modal.querySelector('[data-ms-member="pet-1-photo-2-url"]');
        
        if (photo1) {
          photo1.setAttribute('data-ms-member', 'pet-' + petId + '-photo-1-url');
        }
        if (photo2) {
          photo2.setAttribute('data-ms-member', 'pet-' + petId + '-photo-2-url');
        }
        
        // Recargar Memberstack para actualizar los valores
        if (window.$memberstackDom.reload) {
          window.$memberstackDom.reload();
        }
        
        // Mostrar modal
        modal.style.display = 'flex';
      });
    }
  }
  
  // Función para cerrar modal
  function closeModal() {
    const modal = document.getElementById('pet-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  // Event listeners para botones
  document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Ver detalles
    if (target.getAttribute('data-action') === 'view-details') {
      const petId = target.getAttribute('data-pet-id');
      openDetailsModal(petId);
    }
    
    // Cerrar modal
    if (target.getAttribute('data-action') === 'close-modal') {
      closeModal();
    }
    
    // Reemplazar mascota
    if (target.getAttribute('data-action') === 'replace-pet') {
      const petId = target.getAttribute('data-pet-id');
      if (confirm('¿Estás seguro de que deseas reemplazar esta mascota?')) {
        replacePet(petId);
      }
    }
  });
  
  // Función para reemplazar mascota
  function replacePet(petId) {
    if (!window.$memberstackDom) return;
    
    const customFields = {};
    customFields['pet-' + petId + '-is-active'] = 'false';
    customFields['pet-' + petId + '-replaced-date'] = new Date().toISOString();
    
    window.$memberstackDom.updateMember({
      customFields: customFields
    }).then(function() {
      alert('Mascota reemplazada exitosamente');
      location.reload();
    }).catch(function(error) {
      alert('Error al reemplazar mascota: ' + error.message);
    });
  }
  
  // Cerrar modal al hacer clic en el overlay
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });
  
  // Inicializar cuando Memberstack esté listo
  if (window.$memberstackDom) {
    // Actualizar períodos de carencia para las 3 mascotas
    updateWaitingPeriod(1);
    updateWaitingPeriod(2);
    updateWaitingPeriod(3);
    
    updatePetBadges(1);
    updatePetBadges(2);
    updatePetBadges(3);
    
    // Actualizar contador
    updatePetsCount();
  }
});
</script>
```

---

## 🎨 Estilos CSS

Agrega este código en **Page Settings → Custom Code → Head Code**:

```html
<style>
/* Dashboard Container */
.dashboard-container {
  font-family: 'Outfit', sans-serif;
}

/* User Info Section */
.user-info-section {
  background: #ffffff;
  border-radius: 50px;
  padding: 32px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.user-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
}

.user-status-badge {
  background: #d4edda;
  color: #155724;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
}

.user-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

/* Pets Section */
.pets-section {
  background: #ffffff;
  border-radius: 50px;
  padding: 32px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.pets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
}

.pets-count {
  background: #7DD8D5;
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* Pet Card */
.pet-card {
  background: #f9f9f9;
  border-radius: 30px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.pet-card-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.pet-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.pet-basic-info {
  flex: 1;
}

.pet-name {
  font-size: 20px;
  color: #333;
  margin-bottom: 4px;
}

.pet-breed {
  color: #666;
  font-size: 15px;
  margin-bottom: 2px;
}

.pet-age {
  color: #7DD8D5;
  font-size: 14px;
  font-weight: 600;
}

/* Waiting Period Indicator */
.waiting-period-indicator {
  padding: 16px;
  background: #fff3cd;
  border-radius: 20px;
  margin-bottom: 16px;
}

.waiting-period-indicator.active {
  background: #d4edda;
}

.progress-bar-container {
  height: 8px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin: 12px 0;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7DD8D5, #5bc0bd);
  border-radius: 10px;
  transition: width 0.3s ease;
  width: 0%;
}

.remaining-days {
  font-size: 16px;
  font-weight: 700;
  color: #7DD8D5;
}

/* Pet Badges */
.pet-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 600;
}

.badge-adopted {
  background: #d4edda;
  color: #155724;
}


/* Pet Card Actions */
.pet-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-replace {
  padding: 12px 24px;
  border-radius: 25px;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-primary {
  background: #7DD8D5;
  color: white;
}

.btn-primary:hover {
  background: #5bc0bd;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-replace {
  background: #ffc107;
  color: #333;
}

.btn-replace:hover {
  background: #ffb300;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 30px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-title {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 8px;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 32px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  border-top: 2px solid #f0f0f0;
}

.pet-photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.pet-photos-grid img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20px;
  object-fit: cover;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .pets-grid {
    grid-template-columns: 1fr;
  }
  
  .pets-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
```

---

## ⚙️ Configuración de Memberstack

### Custom Fields Requeridos

Asegúrate de crear estos custom fields en Memberstack (Settings → Custom Fields):

#### Usuario (20 campos)
- `first-name`, `paternal-last-name`, `maternal-last-name`
- `email`, `phone`
- `address`, `city`, `state`, `postal-code`, `colony`
- `registration-date`, `waiting-period-end`
- `ine-front-url`, `ine-back-url`, `proof-of-address-url`
- `gender`, `birth-date`, `curp`

#### Mascotas (57 campos - 19 por mascota × 3)

Para cada mascota (pet-1, pet-2, pet-3):
- `pet-X-name`
- `pet-X-last-name`
- `pet-X-type`
- `pet-X-breed`
- `pet-X-breed-size`
- `pet-X-age`
- `pet-X-is-mixed`
- `pet-X-exceeds-max-age`
- `pet-X-is-adopted`
- `pet-X-is-adopted`
- `pet-X-is-original`
- `pet-X-waiting-period-days`
- `pet-X-waiting-period-end`
- `pet-X-registration-date`
- `pet-X-is-active`
- `pet-X-replaced-date`
- `pet-X-photo-1-url`
- `pet-X-photo-2-url`
- `pet-X-vet-certificate-url`

#### Total
- `total-pets`

---

## ✅ Checklist Final

- [ ] Página creada y configurada como "Members Only"
- [ ] Todos los custom fields creados en Memberstack
- [ ] Estructura HTML completa
- [ ] Atributos `data-ms-member` agregados
- [ ] JavaScript personalizado agregado
- [ ] CSS personalizado agregado
- [ ] Probado con usuario de prueba
- [ ] Responsive verificado en móvil
- [ ] Modal de detalles funcional
- [ ] Función de reemplazo funcional

---

## 🎨 Personalización

### Cambiar Colores

En el CSS, busca y reemplaza:
- `#7DD8D5` → Tu color principal
- `#d4edda` → Color de estado activo
- `#fff3cd` → Color de período de carencia

### Ajustar Tamaños

- Border radius: Busca `border-radius` y ajusta valores
- Padding: Ajusta valores de `padding` según necesites
- Fuente: Cambia `'Outfit'` por tu fuente preferida

---

**¡Dashboard nativo de Webflow listo!** 🎉

Este dashboard es completamente personalizable desde el editor de Webflow y no requiere deployment externo.

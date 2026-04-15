# Guía de Uso: UI/UX Pro Max en Pet Membership Form

Has instalado con éxito el sistema de inteligencia de diseño **UI/UX Pro Max**. Este sistema ahora vive en tu carpeta local `.agent/skills/ui-ux-pro-max` y está listo para ayudarte a elevar la calidad visual de tu proyecto.

## ¿Cómo activarlo?

No necesitas leer los archivos manualmente. Antigravity (yo) utilizará estas reglas automáticamente cuando me pidas tareas de diseño. Solo usa palabras clave de diseño en tus prompts.

### Ejemplos de Prompts:

1.  **Diseño de Nuevas Páginas:**
    *"Diseña una página de 'Estado de Solicitud' para el usuario, siguiendo los principios de UI/UX Pro Max para dashboards premium."*

2.  **Revisión de Estilos Existentes:**
    *"Revisa `src/app/globals.css` y sugiéreme mejoras de contraste y tipografía basadas en el sistema UI/UX Pro Max."*

3.  **Creación de Componentes:**
    *"Crea un componente de 'Card de Mascota' que use efectos de Glassmorphism y micro-animaciones profesionales."*

## Herramientas de Línea de Comandos (Scripts)

El skill incluye scripts de Python que puedes usar para generar sistemas de diseño completos.

### Generar un Sistema de Diseño para un nuevo módulo:
Si vas a crear una nueva sección (ej. un panel para veterinarios), puedes ejecutar:

```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py "veterinary dashboard management" --design-system
```

### Buscar Paletas de Colores o Tipografía:
```bash
# Buscar paletas para "Fintech/Seguros" (parecido a Membresías)
python .agent/skills/ui-ux-pro-max/scripts/search.py "fintech" --domain color

# Buscar tipografías elegantes
python .agent/skills/ui-ux-pro-max/scripts/search.py "elegant modern" --domain typography
```

## Checklist de Calidad (Integrado)

Cada vez que genere código UI para ti, verificaré automáticamente:
- **Accesibilidad:** Contraste 4.5:1, etiquetas ARIA, navegación por teclado.
- **Interacción:** Targets de 44x44px, estados de hover estables, `cursor-pointer`.
- **Aesthetic:** Uso de SVGs (no emojis), transiciones suaves (150-300ms), espaciados consistentes.

---
*Tip: El sistema está configurado para priorizar **Modo Oscuro** y **Glassmorphism** si no especificas lo contrario, ideal para el look "Premium" que buscas.*

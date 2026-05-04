# Design Tokens - Club Pata Amiga

Valores técnicos para implementación de componentes.

## Colores (CSS Variables)

```css
:root {
    --color-primary: #15BEB2;
    --color-action-orange: #FE8F15;
    --color-lime: #9FD406;
    --color-yellow: #FEBD01;
    --color-pink: #FE0063;
    --color-white: #FFFFFF;
    --color-black: #181C1C;
}
```

## Bordes y Sombras

```css
/* Estilo Brutalista Estándar */
.brutalist-border {
    border: 2px solid var(--color-black);
}

.brutalist-shadow {
    box-shadow: 4px 4px 0px var(--color-black);
}

.brutalist-shadow-lg {
    box-shadow: 8px 8px 0px var(--color-black);
}
```

## Tipografía

| Categoría | Fuente | Pesos |
|-----------|--------|-------|
| Headings | `Fraiche` | 300, 600 |
| Body | `Outfit` | 400, 500, 600, 700 |

## Layout y Espaciado

- **Max Container Width**: `1400px`
- **Main Column Max Width**: `550px` (Ideal para legibilidad de formularios)
- **Grid Gap**: `24px` (Desktop), `16px` (Mobile)
```

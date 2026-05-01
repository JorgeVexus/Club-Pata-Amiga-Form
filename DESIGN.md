---
tokens:
  color:
    brand:
      turquoise: "#15BEB2"  # Primary Teal/Turquoise used in Navbar and main CTA
      turquoise-light: "#7DD8D5"
      orange: "#FE8F15"     # Primary CTA color (Hero button)
      orange-deep: "#FF8400" # Used in vaccination section
      yellow: "#FFBD00"     # Background for "Nuestra Manada" and "Cómo funciona"
      yellow-bright: "#FEBD01"
      lime: "#9FD406"       # Primary Heading color and Success states
      pink: "#FE0063"       # Used in emergency section
      beige: "#FFFCE7"      # Brand background
    ui:
      white: "#FFFFFF"
      gray-light: "#EAEAEA" # Page backgrounds
      gray-medium: "#B8B8B8" # Borders
      text-dark: "#2D3748"
      text-muted: "#718096"
    status:
      success: "#38A169"
      error: "#E53E3E"
      pending: "#9CA3AF"
  typography:
    family:
      heading: "Fraiche, sans-serif"
      body: "Outfit, sans-serif"
    scale:
      hero: "100px"
      h1: "70px"
      h2: "50px"
      h3: "30px"
      h4: "25px"
      large: "20px"
      base: "18px"
      small: "16px"
      xs: "14px"
      tiny: "12px"
    weight:
      light: 300
      regular: 400
      medium: 500
      semibold: 600
      bold: 700
      black: 800
  spacing:
    xs: "0.5rem"
    sm: "0.75rem"
    md: "1rem"
    lg: "1.5rem"
    xl: "2.5rem"
    "2xl": "4rem"
  radius:
    pill: "50px"
    container: "50px"
    modal: "32px"
    card: "25px"
    button-small: "21px"
  elevation:
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    xl: "2px 4px 15px 0px rgba(0, 0, 0, 0.15)" # Used for cards
  motion:
    duration:
      fast: "0.2s"
      standard: "0.3s"
      slow: "0.5s"
    easing:
      out: "cubic-bezier(0.16, 1, 0.3, 1)"
      standard: "ease"
---

# Design System: Club Pata Amiga

Club Pata Amiga's visual identity is designed to be **vibrant, friendly, and premium**, reflecting the love and care people have for their pets while maintaining a professional and trustworthy feel for a membership service.

## Look & Feel

### Playful Elegance
The design balances a playful personality with a sleek, modern interface. This is achieved through the contrast between the **Fraiche** font—which has a soft, approachable, and almost "paws-like" quality—and the clean, geometric **Outfit** body text.

### High Contrast & Vibrancy
The color palette is unapologetically bold. 
- **Turquoise (#15BEB2)** and **Lime Green (#9FD406)** create a high-energy environment that guides the user through the registration flow.
- **Orange (#FE8F15)** is used strategically for primary actions and Hero section highlights.
- **Vibrant Pink (#FE0063)** and **Deep Orange (#FF8400)** are used to differentiate service categories like Emergencies and Vaccinations.

### Soft Geometry
Hard edges are strictly avoided.
- **Pill Radius (50px)**: Used for all primary buttons, input fields, and the main navbar.
- **Card Radius (25px-35px)**: Used for content sections and benefit cards.
- **Safe Aesthetic**: The rounding makes the interface feel safe, inviting, and "soft to the touch."

## Visual Patterns

### Glassmorphism & Depth
The application uses subtle depth patterns:
- **Card Elevations**: Large, soft elevations (`xl`) are used for "floating" elements like plan cards and service category cards.
- **Blurred Backdrops**: Modals and overlays use background blurs to maintain context while focusing user attention.

### Interactive Feedback
Interaction is a core part of the experience. 
- **Button Micro-interactions**: Buttons lift slightly on hover and use subtle glow effects.
- **Error States**: Form fields utilize a "shake" animation combined with a pulsing red glow when validation fails.
- **Smooth Navigation**: Pages and steps fade and slide into place, ensuring a smooth, app-like feeling.

### Iconic Identity
The design relies on simple, clean iconography for pet types and service benefits, often paired with the primary brand colors to create a cohesive visual language.

## Design Intent

Every visual element serves the goal of **reducing friction in the registration process**. By making the form feel like a "journey" rather than a chore—through the use of large typography, friendly colors, and clear step indicators—we encourage users to complete the enrollment for their pets.

The "Pata Amiga" brand is built on the concept of a **"solidarity fund" (Manada)**, and the design reflects this community aspect by feeling warm, inclusive, and high-quality. The use of hand-drawn elements like paw prints adds a personal, human touch to the digital experience.

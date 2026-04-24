---
name: Pet Membership Form
description: Premium "Club Pata Amiga" membership registration and management system.
colors:
  primary: "#7DD8D5"
  primary-action: "#FE8F15"
  deep-accent: "#00BBB4"
  neutral-bg: "#FFFFFF"
  text-dark: "#2D3748"
  text-light: "#718096"
  success: "#38A169"
  error: "#E53E3E"
typography:
  display:
    fontFamily: "Fraiche, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4rem)"
    fontWeight: 900
    lineHeight: 0.9
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "15px"
  md: "35px"
  lg: "50px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.deep-accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
  input-field:
    backgroundColor: "transparent"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
---

# Design System: Pet Membership Form

## 1. Overview

**Creative North Star: "The Clubhouse Sanctuary"**

A premium design system that transforms a complex registration process into an exclusive "club" experience. The aesthetic balances high-energy accents (Action Orange) with a calming, trustworthy base (Club Turquoise). It relies heavily on glassmorphism and organic, rounded shapes to feel approachable and modern.

**Key Characteristics:**
- **Glassmorphic Depth**: Surfaces use semi-transparent backgrounds and backdrop blurs to feel light and layered.
- **Round Confidence**: Extreme border-radii (50px) on inputs and buttons signal a friendly, non-bureaucratic environment.
- **Vibrant Precision**: Saturated colors are used strategically to guide the eye toward primary actions without overwhelming the UI.

## 2. Colors

A balanced palette of vibrant "pet-friendly" hues and professional "fintech" neutrals.

### Primary
- **Club Turquoise** (#7DD8D5): The main brand identity color. Used for progress indicators, success states, and brand markers.
- **Action Orange** (#FE8F15): High-contrast color reserved for primary calls to action (Next, Submit, Send).
- **Pata Teal** (#00BBB4): A deeper variant used for secondary actions and active tab states.

### Neutral
- **Text Dark** (#2D3748): Primary readability color for headings and body text.
- **Text Light** (#718096): Used for help text and secondary labels.
- **Glass White** (rgba(255, 255, 255, 0.85)): The default background for floating panels and modals.

**The Rare Accent Rule.** Action Orange is used on ≤10% of any given screen. Its presence signals the one thing the user should do next.

## 3. Typography

**Display Font:** Fraiche
**Body Font:** Outfit

**Character:** A pairing of a punchy, heavy display face for impact and a clean, geometric sans for technical precision.

### Hierarchy
- **Display** (900, 2rem-4rem, 0.9): Hero headlines and large greetings.
- **Headline** (700, 1.5rem, 1.2): Section titles within the membership widget.
- **Title** (600, 1.125rem, 1.4): Card headings and field labels.
- **Body** (400, 1rem, 1.4): Primary information and member instructions. Max line length 65ch.
- **Label** (900, 0.875rem, normal, uppercase): Tab buttons and status badges.

## 4. Elevation

The system uses a "Layered Glass" approach. Depth is conveyed through backdrop blurs and soft, diffuse shadows rather than heavy borders.

**The Floating Panel Rule.** All primary interaction areas (like the membership widget) float above the background with a soft shadow (0 20px 40px rgba(0, 0, 0, 0.1)) and a subtle blur.

## 5. Components

### Buttons
- **Shape:** Round (50px radius) with a 2px solid black border.
- **Primary:** Action Orange background, black text.
- **Hover:** Slight lift (translateY(-2px)) and a soft orange glow.

### Inputs / Fields
- **Style:** Round (50px radius), borderless, with a soft background or shadow.
- **Focus:** 3px glow in Club Turquoise (rgba(125, 216, 213, 0.3)).

### Pata Chat Bubbles
- **Style:** Highly rounded bubbles with distinct colors for Member (Turquoise) vs Admin (Neutral Gray).
- **Media**: Integrated image and file previews with soft rounded corners.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for dynamic color variations while keeping the hex values in DESIGN.md as the source of truth.
- **Do** use Fraiche for all major numeric indicators (waiting period days).
- **Do** keep buttons consistently rounded at 50px.

### Don't:
- **Don't** use sharp corners (radius < 15px) on any interactive element.
- **Don't** use side-stripe borders as status indicators; use full background tints and badges instead.
- **Don't** mix more than two Action Orange elements on the same viewport.

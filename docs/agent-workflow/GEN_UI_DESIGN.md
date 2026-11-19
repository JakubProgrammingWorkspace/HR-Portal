# Framework-Agnostic Design Blueprint & Style Instructions

This document provides a universal, framework-agnostic blueprint to design and style web applications. Whether the application is built using React, Vue, Angular, or backend-driven templates like PHP Symfony (Twig), Laravel (Blade), Django, or Vanilla HTML/CSS, these guidelines will elevate the visual design into a premium, tactile, and highly interactive "digital instrument."

---

## 1. Universal Color & Theme System (CSS Custom Properties)

To ensure styling is framework-agnostic, define all design tokens using native **CSS Custom Properties (Variables)** in your global stylesheet (e.g., `main.css`, `app.css`, `index.css`). This works seamlessly with Tailwind CSS, Bootstrap, Sass/SCSS, or vanilla CSS.

### Theme Definition: "Organic Technical"
Define these variables in your root element:

```css
:root {
  /* Colors */
  --color-bg-app: #FFFEF9;          /* Brand Cream canvas background */
  --color-bg-card: #FFFFFF;         /* Solid white for panels */
  --color-text-primary: #111827;    /* Near-black for primary text and headings */
  --color-text-secondary: #475569;  /* Slate-600 for subtext and descriptors */
  
  --color-accent-primary: #276648;  /* Brand Moss (Main interactive accent) */
  --color-accent-hover: #38A169;    /* Brand Moss Light for hover states */
  --color-accent-danger: #E0603E;   /* Brand Rust for deletes/alerts */
  --color-accent-danger-hover: #B04224; /* Darkened Rust (derived) */
  
  --color-border-subtle: rgba(226, 232, 240, 0.6); /* Soft boundary borders */
  
  /* Typography */
  --font-heading-ui: "Plus Jakarta Sans", "Outfit", system-ui, sans-serif;
  --font-data-mono: "JetBrains Mono", "IBM Plex Mono", monospace;
  
  /* Radii & Shadows */
  --radius-container: 1.5rem;       /* 24px - for major cards/sections */
  --radius-element: 0.75rem;        /* 12px - for buttons/inputs */
  --shadow-tactile: 0 10px 30px -15px rgba(0, 0, 0, 0.05);
  --shadow-tactile-hover: 0 20px 40px -20px rgba(0, 0, 0, 0.08);
}

/* Dark Mode Implementation */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-app: #141823;          /* Deep Navy */
    --color-bg-card: #1C2236;         /* Navy Card */
    --color-text-primary: #F9FAFB;    
    --color-text-secondary: #94A3B8;  
    --color-accent-primary: #22C55E;  /* Brighter Moss for dark mode */
    --color-accent-hover: #4ADE80;    /* Brighter Moss Light for dark mode */
    --color-border-subtle: rgba(255, 255, 255, 0.1);
    --shadow-tactile: 0 10px 30px -15px rgba(0, 0, 0, 0.4);
    --shadow-tactile-hover: 0 20px 40px -20px rgba(0, 0, 0, 0.6);
  }
}
```

---

## 2. Visual Texture: Global CSS Noise Overlay

To give templates a physical, premium feel and eliminate sterile digital gradients, include a subtle noise overlay. 

### Implementation:
Insert this raw SVG markup directly at the bottom or top of your main template (e.g., React `index.html`, Twig `base.html.twig`, Blade `app.blade.php`):

```html
<svg style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; opacity: 0.035; z-index: 9999;" xmlns="http://www.w3.org/2000/svg">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
</svg>
```

---

## 3. Typography Integration

Ensure premium fonts are loaded at the layout level:

### HTML Layout Import:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Global Typography Rules:
```css
body {
  font-family: var(--font-heading-ui);
  background-color: var(--color-bg-app);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading-ui);
  letter-spacing: -0.02em; /* Tighter letter-spacing for premium headings */
  font-weight: 700;
}

code, pre, .font-mono, .data-column {
  font-family: var(--font-data-mono);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
```

---

## 4. Component Layout Blueprints

### A. The Floating Navigation Sidebar/Pill Navbar
Avoid standard screen-edge sidebar blocks. Instead, float the navigation.
- **Layout**: Center or float off the screen edge. E.g., `margin: 1rem; width: 16rem; height: calc(100vh - 2rem); position: fixed;`
- **Styling**: `background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-container); box-shadow: var(--shadow-tactile);`
- **Active Navigation States**: Use pill-shaped active elements with high contrast (e.g., `background-color: var(--color-accent-primary); color: #ffffff;`) and a soft transition scale.
- **Micro-transition on hover**: Shift active items forward slightly:
  ```css
  .nav-item {
    transition: transform 0.2s ease, background-color 0.2s ease;
  }
  .nav-item:hover {
    transform: translateX(4px);
  }
  ```

### B. Tactile Cards & Sections
Make main display cards feel like physical items:
```css
.card-tactile {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-container);
  box-shadow: var(--shadow-tactile);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-color 0.3s ease;
}

.card-tactile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-tactile-hover);
  border-color: rgba(39, 102, 72, 0.15);
}
```

### C. Tactile Forms & Inputs
Forms should avoid basic box borders. Instead, make them respond immediately to focus:
```css
.input-tactile {
  border-radius: var(--radius-element);
  border: 1px solid rgba(226, 232, 240, 0.8);
  background-color: rgba(248, 250, 252, 0.5);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.input-tactile:focus {
  background-color: #ffffff;
  border-color: var(--color-accent-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(39, 102, 72, 0.08);
}
```

### D. Modern Data Tables
Rather than squashed lines and heavy black borders:
- **Spacing**: Do not collapse borders. Use `border-collapse: separate; border-spacing: 0 0.5rem;` to create separated rows, or use clean spacing with light background highlights.
- **Headings**: Styled in upper-case with letter-spacing `text-transform: uppercase; font-size: 0.625rem; font-weight: 700; letter-spacing: 0.08em; color: var(--color-text-secondary);`.
- **Data Columns**: Wrap identifier columns (PESEL, NIP, Phone, Dates) in elements styled with `var(--font-data-mono)` and lower font size for precise spacing.
- **Table Hover Rows**: Apply a smooth transition on rows to highlight selections:
  ```css
  tr.row-interactive {
    transition: background-color 0.2s ease, transform 0.2s ease;
  }
  tr.row-interactive:hover {
    background-color: rgba(248, 250, 252, 0.6);
  }
  ```

---

## 5. Micro-Animations & Button Physics

Buttons must feel magnetic and reactive:

```css
.btn-magnetic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-element);
  font-weight: 500;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              background-color 0.2s ease,
              box-shadow 0.2s ease;
}

.btn-magnetic:hover {
  transform: scale(1.025) translateY(-1px);
}

.btn-magnetic:active {
  transform: scale(0.975);
}

/* Accent primary button */
.btn-primary {
  background-color: var(--color-accent-primary);
  color: #ffffff;
}
.btn-primary:hover {
  background-color: var(--color-accent-hover);
  box-shadow: 0 4px 12px rgba(39, 102, 72, 0.15);
}

/* Danger / Delete button */
.btn-danger {
  background-color: var(--color-accent-danger);
  color: #ffffff;
}
.btn-danger:hover {
  background-color: var(--color-accent-danger-hover);
  box-shadow: 0 4px 12px rgba(224, 96, 62, 0.15);
}
```

---

## 6. Accessibility (A11y) & State Feedback

A premium UI must be accessible and responsive.

### Touch Targets & Focus
- Ensure all interactive elements (buttons, links, inputs) have a minimum touch target size of `44x44px` for mobile accessibility.
- Never remove focus rings completely without a custom replacement. The `.input-tactile:focus` class ensures keyboard users can navigate clearly.

### Skeleton Loading States
Never show plain text like "Loading..." in a premium app. Use animated skeleton placeholders:
```css
.skeleton {
  background: linear-gradient(90deg, var(--color-border-subtle) 25%, rgba(226, 232, 240, 0.2) 50%, var(--color-border-subtle) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-element);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 7. Implementation Checklist for Agents

Regardless of framework (React, Symfony/Twig, Laravel, etc.), follow these steps to execute a design upgrade:

1. **Load Fonts & Assets**: Add Google Font tags and the global SVG noise structure to the core base template layout.
2. **Apply Design Tokens**: Define the CSS variables at the root of the application stylesheet.
3. **Restructure Layout & Navigation**: Adapt the template files to wrap the main menu in a floating navigation container. Remove rigid screen-spanning bars.
4. **Upgrade Forms**: Modify input elements, drop-downs, and forms to use rounded classes and state transition variables.
5. **Modernize Tables**: Format table views into clean data grids, styling the headers as uppercase metadata and table data using the monospaced font family where appropriate.
6. **Apply Animations & Physics**: Wrap action triggers and clickable components in magnetic transition classes.
7. **Verify Builds**: Run the framework compilation or build commands to ensure styles compile correctly.

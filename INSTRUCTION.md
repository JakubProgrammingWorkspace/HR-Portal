# HR-Portal Redesign Blueprint & Design Instructions

Use this document as an explicit instruction manual to redesign the HR-Portal user interface. The goal is to elevate the portal from a flat, clinical, default-Tailwind appearance to a premium, tactile, high-density digital workspace inspired by creative-technologist design systems.

---

## 1. Visual Identity & Design System

To match the professional yet avant-garde nature of a modern HR portal, implement the **"Organic Tech" (Clinical Boutique)** design preset adapted for SaaS utility:

- **Typography**: 
  - **Primary & UI**: `Outfit` or `Plus Jakarta Sans` (sleek, geometric, tight tracking `-0.02em`).
  - **Data / Monospace**: `JetBrains Mono` or `IBM Plex Mono` (for NIP, PESEL, phone numbers, and statuses).
- **Color Palette**:
  - **App Background**: Soft ivory/alabaster `hsl(48, 20%, 96%)` / `#FAF9F5` or clean slate-blue tint `#F8FAFC`.
  - **Container Background**: Pure white `#FFFFFF` with glassmorphic accents (`bg-white/80 backdrop-blur-md`).
  - **Accent Colors**: 
    - Moss / Forest Green `#2E4036` (Primary interactive)
    - Rust / Coral `#CC5833` (Secondary/Alerts)
    - Charcoal `#1E293B` (Text/Headings)
- **Container Radius**: `rounded-[1.5rem]` to `rounded-[2rem]` for page containers, dashboard widgets, and main components. No sharp 90-degree corners.
- **Borders**: Thin, low-contrast borders (`border-slate-100` or `border-slate-200/50`).

---

## 2. Global Styling & Foundation Setup

### index.html (SVG Noise Overlay)
Add a permanent, lightweight noise overlay to the top level of `index.html` to eliminate flat digital gradients and introduce a high-end physical texture:
```html
<!-- Inside <body>, before <div id="root"> -->
<svg class="pointer-events-none fixed inset-0 opacity-[0.035] z-[9999]" xmlns="http://www.w3.org/2000/svg">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
</svg>
```

### index.html (Google Fonts)
Inject the typography links in the `<head>` of `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### index.css (Theme Variables & Custom Utilities)
Set up the custom classes and fonts in `src/index.css` using Tailwind v4 syntax:
```css
@import "tailwindcss";

@theme {
  --font-sans: "Plus Jakarta Sans", "Outfit", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --color-brand-moss: #2E4036;
  --color-brand-moss-light: #445D4F;
  --color-brand-rust: #CC5833;
  --color-brand-cream: #FAF9F5;
}

body {
  background-color: var(--color-brand-cream);
  color: #1E293B;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Custom interactive micro-effects */
.btn-magnetic {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.2s ease;
}
.btn-magnetic:hover {
  transform: scale(1.025) translateY(-1px);
}
.btn-magnetic:active {
  transform: scale(0.975);
}

.card-tactile {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.03);
  border-radius: 1.5rem;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.card-tactile:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.06);
  border-color: rgba(46, 64, 54, 0.15);
}
```

---

## 3. Sidebar Redesign (Layout.tsx)

Transform the menu into a **"Floating Island" Sidebar**:
- **Layout**: Float off the left screen edge rather than sticking edge-to-edge. Use margins: `fixed left-4 top-4 bottom-4 w-68`.
- **Styling**: `bg-white/80 border border-slate-200/50 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)]`.
- **Navigation Links**:
  - Use `lucide-react` icons (install `npm install lucide-react` if not present).
  - Active states should feel fluid. Use a smooth background pill: `bg-brand-moss text-white shadow-md` or `bg-slate-100 text-brand-moss`.
  - Hover states should raise the element slightly (`translate-x-1 transition-all duration-200`).
- **Footer Section**:
  - Add a dynamic "System Operational" status pill with a pulsing green dot and monospace text at the bottom of the sidebar.

---

## 4. Page Layouts & Typography Redesign

### Page Headers
Modify titles on all pages to create visual hierarchy:
- Primary Title: `h1` using `font-extrabold tracking-tight text-slate-800 text-3xl font-sans`
- Description: `p` using `text-sm text-slate-500 font-sans tracking-wide`

### Forms Redesign
Forms (e.g., `AddEmployeeForm`, `AddCompanyForm`) currently look like standard flat blocks. Update them:
- Wrap in a collapsable/expandable card component to keep layouts clean.
- Form Card: Use `.card-tactile` with `p-6` or `p-8`.
- Inputs: Use `rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-brand-moss focus:ring-2 focus:ring-brand-moss/10 transition-all px-4 py-2.5`.
- Buttons: Apply `.btn-magnetic` and use `bg-brand-moss text-white hover:bg-brand-moss-light font-medium rounded-xl px-5 py-2.5`.

### Tables Redesign
Data lists must look like clean dashboards:
- Table container: Wrap in `overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm`.
- Table head: Use background color `bg-slate-50/50`, headers styled with `text-[10px] font-bold tracking-wider text-slate-400 uppercase py-4 px-6`.
- Table rows: Add spacing, light borders, and hover elevation:
  - Transition on hover: `hover:bg-slate-50/50 transition-colors`.
  - Numeric/identifier columns (PESEL, NIP, Phone) must render in `font-mono text-slate-600 text-xs`.
- Actions: Replace raw text buttons (like "Usuń") with clean, modern action icon buttons (e.g., Lucide `Trash2` or `Edit` buttons styled inside minimal rounded circular rings).

---

## 5. Dashboard Page Expansion (DashboardPage.tsx)

Replace the empty page with a responsive, high-fidelity landing page for administrators:
- **Grid Layout**: 4-column metric grid at the top showing visual counts:
  - Total Employees (icon + count + percentage change)
  - Total Companies (icon + count)
  - Active Referrals (icon + status)
  - System Users (role distribution)
- **Visual Artifacts**:
  - **Telemetry Typewriter Feed**: A terminal-style box showing system status: e.g., `"Checking security protocol..."`, `"Syncing with database..."`.
  - **Weekly Status Graph**: Create an inline CSS/SVG metric visual representing referral volume or weekly workload.

---

## 6. Login Page Redesign (LoginPage.tsx)

Elevate the login entrance:
- Use a split-screen layout:
  - **Left side (60%)**: A large decorative panel with a dark background matching the preset (e.g., `bg-brand-moss`), an organic/biotech background texture (or abstract glowing SVGs), and large contrast text matching the preset's hero line: `"Modern HR Platform."` / *"Precision administration meets beautiful design."*
  - **Right side (40%)**: A clean, minimalist login form card set against a soft textured background.
- Inputs & Submit button should follow the form design guidelines (rounded edges, custom focus rings, magnetic animations).

---

## Redesign checklist for the executing agent:
1. [ ] Install `lucide-react` icon dependency.
2. [ ] Inject Google Font links and noise SVG container into `frontend/index.html`.
3. [ ] Define core Tailwind CSS v4 variables and theme in `frontend/src/index.css`.
4. [ ] Revamp `components/Layout.tsx` with floating pill-style navigation and custom active transitions.
5. [ ] Build standard dashboard widgets and dynamic elements inside `pages/DashboardPage.tsx`.
6. [ ] Redesign forms and tables inside `pages/EmployeesPage.tsx`, `pages/CompaniesPage.tsx`, `pages/UsersPage.tsx`, and `pages/ExposureFactorsPage.tsx` using the custom theme variables.
7. [ ] Redesign `pages/LoginPage.tsx` with a modern visual split screen.
8. [ ] Build the project to verify that there are no TS compilation or CSS rendering errors.

# Impeccable critique fixes (home cine-scroll)
Objetivo: aplicar, de a un comando por vez, el plan de la crítica `.impeccable/critique/2026-11-21T01-03-19Z__src-pages-index-astro.md` (24/36). Rama: `feat/home-cine-scroll`.
Respuestas del usuario: prioridad «Modo claro + foco», modo claro «Luz técnica», alcance «Todo», ejecución «Si corre uno a uno».

## Specs

1. **S1 — Modo claro "luz técnica" (`/impeccable colorize`):** «Papel, tinta negra, un teal sobrio, sin glow ni blobs». Del plan: fondo de papel cálido (`oklch(97% 0.012 75)`), tinta casi negra, un solo teal sobrio con el gradiente de FONTÁN ≥4.5:1, sin glow ni blobs en claro.
2. **S2 — Anillo de foco:** «el anillo de foco pasa a `var(--fx-ink-accent)` en ambos temas (hoy fijo, 1.87:1 sobre blanco)»; indicador ≥3:1 (WCAG 1.4.11) en claro y oscuro.
3. **S3 — Capturas en los paneles (`/impeccable bolder`):** «las `*-cover.png` de cada proyecto en un marco enmascarado (~38 % de ancho) ocupan la mitad vacía de cada panel y reemplazan los blobs». Corregido por L3: «Recortes de la UI real» (capturas nuevas de cada demo, no los banners de README).
4. **S4 — Hero y contacto (`/impeccable layout`):** «el hero gana cargo (de `profile.json`) + "ver los 4 proyectos ↓" + email; un panel final de contacto con `fgjcarlos@gmail.com` escrito en display». L3: «Sacarla del hero y la meta» — quitar "visión artificial" de `Home.astro:36` y `Layout.astro:19`.
5. **S5 — Navegación y copy (`/impeccable clarify`):** «ancla por proyecto para que "← Proyectos" vuelva al proyecto del que venías; "Sobre mí" con un posicionamiento + las 3 `focusAreas`; menú móvil que se cierra con Esc y clic afuera; un solo "destacado", año en cada panel, orden por fecha; `aria-pressed` en el toggle de tema».
6. **S6 — Tipografía (`/impeccable typeset`):** «`.cine-grad { display: inline-block }` para que aparezca el violeta; revisar si `system-ui` es el display correcto; prosa del proyecto a ~65ch (sacar `max-w-none`); devolver `scroll-padding` al foco en móvil». L3 («Dentro de T5/T6»): ritmo de los h2 (0px arriba / 18px abajo) y "Node-RED" partido a 390.
7. **S7 — Pulido (`/impeccable polish`):** pasada final en ambos temas, móvil y teclado. L3 («Dentro de T5/T6»): skip link + `<main id>`, objetivos táctiles ≥44px (código/demo, filas del menú), bug del reveal (`threshold: 0.2` nunca dispara en elementos >5 viewports), glow sin desplazamiento del CTA en oscuro.

## Tasks

- **T1** [S1,S2] — delegated (`gentle-ai-worker`, Context backstop); done; RED real (anillo claro 1.87, gradiente 3.42, papel 1.017) → GREEN 6/6, suite 67/67, lint/check exit 0, oscuro sin cambios de píxeles; commit: `80201c9`.
- **T2** [S3] — delegated (`gentle-ai-worker`, Context backstop); done; RED 3 fallos (0 img, 8 blobs) → GREEN, suite 70/70, lint/check exit 0, detector []; commit: ver `git log` (feat(home): real project UI in each panel).
- **T3** [S4] — delegated (`gentle-ai-worker`, Context backstop); done; RED 7/8 fallos → GREEN 10/10, suite 80/80, lint/check exit 0, detector []; commit: feat(home): hero actions and contact panel.
- **T4** [S5] — delegated (`gentle-ai-worker`, Context backstop); done; RED 8/8 fallos → GREEN 8/8, suite 88/88, lint/check exit 0, detector []; commit: feat(home): about panel, project anchors and clearer navigation.
- **T5** [S6] — delegated (`gentle-ai-worker`, Context backstop); done; RED 7 aserciones → GREEN 11/11, suite 99/99 ×4, lint/check/build exit 0, detector []; commit: feat(type): Archivo display face, visible gradient and calmer measures.
- **T6** [S7] — delegated (`gentle-ai-worker`, Context backstop); done; RED 8+3 → GREEN, suite 111/111 ×2, project-shots ×20 60/60, lint/check/build exit 0, detector []; commit: feat(a11y): skip link, touch targets and final polish.

## Log

- L1: «Si corre uno a uno» (respuesta a la lista de 6 comandos de la crítica; antes: «Modo claro + foco», «Luz técnica», «Todo»).
- L2: T1 hecho. Hallazgo del worker: en `Home.astro` las reglas `[data-theme="dark"] .cine-blob` (screen) y `.cine-grain` (0.07) nunca aplicaban por el scoping de Astro; se dejan así porque el oscuro debía quedar igual. Relevante para T2 (los blobs se reemplazan).
- L3: Re-crítica tras T1 (`.impeccable/critique/2026-11-21T09-44-32Z__src-pages-index-astro.md`, 20/32). Respuestas: «Sacarla del hero y la meta», «Recortes de la UI real», «Dentro de T5/T6».
- L4: «Implementa todo» (T2–T6, secuencial: comparten `Home.astro`).
- L5: T2 hecho. Origen de las capturas: MCM = captura real del dashboard (repo `docs/accessibility/...`); LGB = diagrama de arquitectura de su página (Pre-MVP, sin UI compilada); NRCC = tabla de roadmap (el proyecto usa marcadores en vez de capturas); ESP32 = maqueta de la pantalla TFT del gateway (`design/tft-status-v01`). `#sobre-mi` volvió al hero (+ handler de ancla) porque `homepage-copy.spec.ts` exige `#sobre-mi img` = 0; T4 le da su panel propio. Test cambiado: "keeps the dark theme decoration" → "keeps the dark theme project screenshots" (los blobs se eliminan por diseño).
- L6: T3 hecho. Rol del hero = `profile.json` title; chip `.cine-badge` eliminado (ban craft-floor); `#contacto` pasa del footer al panel final y el nav usa `/#contacto`. Aserciones cambiadas: homepage-copy cuenta de paneles +1→+2 (panel de contacto); light-theme lista de glows sin `.cine-dot` (eliminado). Rama N=0 sin cobertura e2e.
- L7: T4 hecho. Decisión del padre: en vez de elegir un único "destacado" (decisión de contenido), la home deja de mostrar "destacado" (`featured` intacto) y muestra el año; orden por `publishDate` desc: LGB 2026, NRCC 2026, ESP32 2025, MCM 2025. "Sobre mí" usa el primer párrafo de la bio y las 3 focusAreas verbatim; la tercera dice "IoT, visión y edge" (OpenCV, cámaras): pendiente de confirmar con el usuario por L3. Aserciones cambiadas: homepage-copy (`#sobre-mi h1`→`.cine-hero h1`, paneles +2→+3), hero-contact (`#sobre-mi`→`.cine-hero`), anchor-scroll (Sobre mí ya no es scrollY 0).
- L8: T5 hecho. Display = Archivo variable (OFL, latin, 34 KB, self-hosted en `public/fonts/`, fallback con size-adjust 98.6 %). Prosa del detalle a 70ch. Un fallo aislado no reproducido (1 de 5 corridas) en `project-shots` "no desborda en móvil" (scrollWidth +5): revisar en T6. El h1 del detalle sigue en mono; el panel de contacto no tiene heading.
- L9: T6 hecho. El fallo aislado de T5 no se reprodujo; el test ahora mide con la página asentada (umbral intacto). Dejado a propósito: glow de la barra de progreso, tamaño de los enlaces del nav de escritorio y del pie. Feature cerrada; sin push.

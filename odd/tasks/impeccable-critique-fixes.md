# Impeccable critique fixes (home cine-scroll)
Objetivo: aplicar, de a un comando por vez, el plan de la crítica `.impeccable/critique/2026-11-21T01-03-19Z__src-pages-index-astro.md` (24/36). Rama: `feat/home-cine-scroll`.
Respuestas del usuario: prioridad «Modo claro + foco», modo claro «Luz técnica», alcance «Todo», ejecución «Si corre uno a uno».

## Specs

1. **S1 — Modo claro "luz técnica" (`/impeccable colorize`):** «Papel, tinta negra, un teal sobrio, sin glow ni blobs». Del plan: fondo de papel cálido (`oklch(97% 0.012 75)`), tinta casi negra, un solo teal sobrio con el gradiente de FONTÁN ≥4.5:1, sin glow ni blobs en claro.
2. **S2 — Anillo de foco:** «el anillo de foco pasa a `var(--fx-ink-accent)` en ambos temas (hoy fijo, 1.87:1 sobre blanco)»; indicador ≥3:1 (WCAG 1.4.11) en claro y oscuro.
3. **S3 — Capturas en los paneles (`/impeccable bolder`):** «las `*-cover.png` de cada proyecto en un marco enmascarado (~38 % de ancho) ocupan la mitad vacía de cada panel y reemplazan los blobs».
4. **S4 — Hero y contacto (`/impeccable layout`):** «el hero gana cargo (de `profile.json`) + "ver los 4 proyectos ↓" + email; un panel final de contacto con `fgjcarlos@gmail.com` escrito en display».
5. **S5 — Navegación y copy (`/impeccable clarify`):** «ancla por proyecto para que "← Proyectos" vuelva al proyecto del que venías; "Sobre mí" con un posicionamiento + las 3 `focusAreas`; menú móvil que se cierra con Esc y clic afuera; un solo "destacado", año en cada panel, orden por fecha; `aria-pressed` en el toggle de tema».
6. **S6 — Tipografía (`/impeccable typeset`):** «`.cine-grad { display: inline-block }` para que aparezca el violeta; revisar si `system-ui` es el display correcto; prosa del proyecto a ~65ch (sacar `max-w-none`); devolver `scroll-padding` al foco en móvil».
7. **S7 — Pulido (`/impeccable polish`):** pasada final en ambos temas, móvil y teclado.

## Tasks

- **T1** [S1,S2] — delegated (`gentle-ai-worker`, Context backstop); done; RED real (anillo claro 1.87, gradiente 3.42, papel 1.017) → GREEN 6/6, suite 67/67, lint/check exit 0, oscuro sin cambios de píxeles; commit: ver Log L2.
- **T2** [S3] — pending.
- **T3** [S4] — pending.
- **T4** [S5] — pending.
- **T5** [S6] — pending.
- **T6** [S7] — pending.

## Log

- L1: «Si corre uno a uno» (respuesta a la lista de 6 comandos de la crítica; antes: «Modo claro + foco», «Luz técnica», «Todo»).
- L2: T1 hecho. Hallazgo del worker: en `Home.astro` las reglas `[data-theme="dark"] .cine-blob` (screen) y `.cine-grain` (0.07) nunca aplicaban por el scoping de Astro; se dejan así porque el oscuro debía quedar igual. Relevante para T2 (los blobs se reemplazan).

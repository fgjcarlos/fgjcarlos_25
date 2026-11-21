# FGJCARLOS — design system

Synced from project sources. Nothing invented; every value is copied verbatim from `src/styles/global.css` (daisyUI v5 custom themes) unless noted. `tailwind.config.js` adds no extra tokens (`theme.extend` is empty; daisyUI runs with `themes: ["light"]`, `darkTheme: false` — the real dark theme is the CSS custom one below).

## Color — light theme

Source: `src/styles/global.css` → `@plugin "daisyui/theme" { name: "light" }`. Neutro cálido (papel/tinta).

| Token | Value | Usage |
| --- | --- | --- |
| `--color-base-100` | `oklch(99.3% 0.003 80)` | Page background (warm paper) |
| `--color-base-200` | `oklch(96.4% 0.006 80)` | Raised surfaces, code blocks |
| `--color-base-300` | `oklch(92% 0.008 80)` | Borders, separators |
| `--color-base-content` | `oklch(22% 0.014 60)` | Body text (ink) |
| `--color-primary` | `oklch(23% 0.014 60)` | Primary buttons (ink) |
| `--color-primary-content` | `oklch(97% 0.006 80)` | Text on primary |
| `--color-secondary` | `oklch(95% 0.008 80)` | Secondary surface |
| `--color-secondary-content` | `oklch(24% 0.014 60)` | Text on secondary |
| `--color-accent` | `oklch(77% 0.152 181.912)` | Teal accent: links, focus, selection (graphics / large text in light) |
| `--color-accent-content` | `oklch(38% 0.063 188.416)` | Teal text on light surfaces (small text links) |
| `--color-neutral` | `oklch(44% 0.014 60)` | Muted text |
| `--color-neutral-content` | `oklch(98% 0.004 80)` | Text on neutral |
| `--color-info` | `oklch(90% 0.058 230.902)` | Info badge surface |
| `--color-info-content` | `oklch(29% 0.066 243.157)` | Info badge text |
| `--color-success` | `oklch(76% 0.177 163.223)` | `beta` badge |
| `--color-success-content` | `oklch(37% 0.077 168.94)` | `beta` badge text |
| `--color-warning` | `oklch(82% 0.189 84.429)` | `alpha` badge |
| `--color-warning-content` | `oklch(41% 0.112 45.904)` | `alpha` badge text |
| `--color-error` | `oklch(70% 0.191 22.216)` | Error surface |
| `--color-error-content` | `oklch(27% 0.105 12.094)` | Error text |

## Color — dark theme

Source: `src/styles/global.css` → `@plugin "daisyui/theme" { name: "dark" }`. Mismo eje cálido, en grafito.

| Token | Value | Usage |
| --- | --- | --- |
| `--color-base-100` | `oklch(16.5% 0.007 65)` | Page background (graphite) |
| `--color-base-200` | `oklch(21.5% 0.009 65)` | Raised surface |
| `--color-base-300` | `oklch(28.5% 0.011 65)` | Borders |
| `--color-base-content` | `oklch(92% 0.006 85)` | Body text |
| `--color-primary` | `oklch(94% 0.005 85)` | Primary buttons (paper) |
| `--color-primary-content` | `oklch(19% 0.008 65)` | Text on primary |
| `--color-secondary` | `oklch(25% 0.01 65)` | Secondary surface |
| `--color-secondary-content` | `oklch(93% 0.006 85)` | Text on secondary |
| `--color-accent` | `oklch(76% 0.125 183)` | Teal accent, text and graphics |
| `--color-accent-content` | `oklch(96% 0.02 183)` | Text on accent |
| `--color-neutral` | `oklch(85% 0.006 85)` | Muted text |
| `--color-neutral-content` | `oklch(17% 0.006 65)` | Text on neutral |
| `--color-info` | `oklch(62% 0.09 230.902)` | Info |
| `--color-info-content` | `oklch(96% 0.02 230)` | Info text |
| `--color-success` | `oklch(70% 0.15 163.223)` | `beta` |
| `--color-success-content` | `oklch(97% 0.02 163)` | `beta` text |
| `--color-warning` | `oklch(75% 0.16 84.429)` | `alpha` |
| `--color-warning-content` | `oklch(86% 0.11 84.429)` | `alpha` text (outline badges go light on dark) |
| `--color-error` | `oklch(65% 0.18 22.216)` | Error |
| `--color-error-content` | `oklch(96% 0.02 22)` | Error text |

## Typography

Source: `src/styles/global.css` → `@theme`; font package `@fontsource/lxgw-wenkai-mono-tc` (`package.json`).

| Token | Value | Usage |
| --- | --- | --- |
| `--font-display` | `"LXGW WenKai Mono TC", monospace` | The only family — mono-first voice for display and body |

Self-contained artboards cannot load the webfont, so they approximate with the system mono stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` and keep `"LXGW WenKai Mono TC"` first so machines with the font installed render the real voice.

## Radius / metrics

Source: `src/styles/global.css` (both theme blocks, identical values).

| Token | Value |
| --- | --- |
| `--radius-selector` | `0.5rem` |
| `--radius-field` | `0.25rem` |
| `--radius-box` | `1rem` |
| `--border` | `1px` |
| `--depth` | `1` |
| `--noise` | `0` |

## Motion

Source: `src/styles/global.css`.

- Keyframes: `fade-in 0.8s ease-out`, `slide-up 0.6s ease-out`, `slide-in-right 0.5s ease-out`, `card-in 0.55s ease-out` (staggered by IntersectionObserver, `html.js .card-reveal` + `--reveal-delay`; without JS everything shows).
- Theme change: cross-fade of `background-color / border-color / color / fill / stroke` at `0.3s ease` under `html.theme-transition`, applied by the toggle.
- Hover helpers: `hover-lift` (`-translate-y-1` + shadow), `hover-glow`, `interactive-smooth` (`0.2s ease-in-out`).
- Kill switch: `prefers-reduced-motion: reduce` collapses every animation and transition to `0.01ms` and disables smooth scroll.

## Dirección 05 «cine de scroll» (home)

Implementada en el sitio real. Tokens y motion propios, todos derivados de la
paleta base (no inventan colores nuevos: `--fx-h1/h2/h3` son los mismos hues
teal/cian/violeta que ya usa el acento del sitio).

| Token | Valor | Uso |
| --- | --- | --- |
| `--fx-h1` | `182` | Hue del primer tramo del gradiente (teal) |
| `--fx-h2` | `230` | Hue del segundo tramo (cian) |
| `--fx-h3` | `296` | Hue del tercer tramo (violeta) |
| `--fx-l` | `60%` (claro) / `78%` (oscuro) | Lightness del gradiente por tema |
| `--fx-grad` | `linear-gradient(92deg, oklch(--fx-l .14 --fx-h1), oklch(--fx-l .15 --fx-h2), oklch(--fx-l .17 --fx-h3))` | Barra de progreso y acentos decorativos |
| `--fx-ink-accent` | `--color-accent-content` (claro) / `--color-accent` (oscuro) | Tinta de acento legible: teal oscuro sobre papel, teal brillante sobre grafito |

El gradiente **nunca** se aplica a texto: el texto lleva `--color-base-content`
para no perder contraste AA. El acento del sitio (`--color-accent`, hue 183) se
mantiene para enlaces y foco.

### Motion de la dirección 05

| Keyframe | Duración | Qué hace |
| --- | --- | --- |
| `fx-line-rise` | 1s | La línea del titular entra desde abajo (overflow hidden) |
| `fx-blur-rise` | 0.9s | Revelado: opacidad 0→1, translateY 28px→0, blur 8px→0 |
| `fx-float` | 14s | Deriva del blob decorativo |
| `fx-fall` | 1.6s | Línea del indicador de scroll |

- El revelado usa el patrón `html.js` (como `card-reveal`): sin JS todo queda
  visible. `prefers-reduced-motion: reduce` lo desactiva por completo.

## Component rules

Source: `src/styles/global.css`.

| Rule | Behavior |
| --- | --- |
| Cards (`.surface-card`) | Light: hover lift with shadow. Dark: hover raises the border (`color-mix(base-content 28%, base-300)`) because shadows don't read on graphite. |
| Status badges | Outline style; in dark theme badge text stays light against the card, not against the badge color. Status is always named (`alpha`, `beta`), never color-only. |
| Focus | `*:focus-visible` → `outline: 2px solid oklch(77% 0.152 181.912); outline-offset: 2px`. |
| Selection | `::selection` = accent at 25% via `color-mix(in oklch, …)`. |
| Scroll | `scroll-behavior: smooth` with `scroll-padding-top: 5rem`; `[id] { scroll-margin-top: 5rem }`. |
| Theme toggle icon | Moon in light (go dark), sun in dark (go back); `.theme-icon-sun` hidden unless `[data-theme="dark"]`. |

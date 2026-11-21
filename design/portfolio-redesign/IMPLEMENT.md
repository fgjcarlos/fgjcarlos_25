# IMPLEMENT — dirección 05 «cine de scroll» → home real del portfolio

Spec de implementación para el subagente. El artboard `05-cine-scroll.html` es la referencia
visual; el destino es el stack real del repo (Astro 6 + Tailwind v4 + daisyUI v5).

- Repo: `/home/composedof2/Documents/GitHub/fgjcarlos_25` (raíz del repo, `pnpm`).
- Token source: `design/system.md` (leer) + `src/styles/global.css` (leer).
- NO edites `e2e/`, ni `design/`, ni `src/content/**`, ni `src/config/**`.

## Worktree con cambios previos del usuario (NO revertir, NO pisar)

El working tree ya tiene cambios sin commitear del usuario (toggle de tema en `NavBar.astro`,
reveal de tarjetas en `Projects.astro`, anti-FOUC en `Layout.astro`, descripciones nuevas en los
MDX, fixes de contraste). **Construí encima de ellos.** `Home.astro`, `Footer.astro`,
`src/pages/index.astro` y `src/styles/global.css` están sin cambios (solo `global.css` tiene
keyframes nuevos previos: `fade-in`, `slide-up`, `slide-in-right`, `card-in`).

## Archivos a cambiar (y solo estos)

```
src/components/Home.astro
src/components/NavBar.astro
src/components/Footer.astro
src/styles/global.css
src/layouts/Layout.astro
src/pages/index.astro
```

`src/components/ProfileDescription.astro`, `FocusAreas.astro`, `Projects.astro`,
`ProfileLinks.astro` quedan en disco sin usar (no los borres).

## Layout global

`src/layouts/Layout.astro`: hoy `<main>` lleva `container min-h-screen flex flex-col mx-auto
max-w-7xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-none sm:shadow-[...]`. La home necesita full-bleed
(paneles de 100vh); las páginas de proyecto y 404 necesitan la medida actual.

- Añadí una prop booleana `fullBleed?: boolean` a `Props` (por defecto `false`).
- Con `fullBleed` → `<main>` sin `container/max-w/mx-auto/padding/shadow`, `w-full`.
- Sin `fullBleed` → el `<main>` actual intacto (proyecto y 404 no cambian de aspecto).
- `src/pages/index.astro` → `<Layout fullBleed>`.
- NavBar y Footer quedan dentro de `<main>`: con full-bleed, NavBar pasa a `fixed` (ya lo es
  visualmente en el artboard) y el Footer es el bloque de contacto.

## Tokens nuevos (en `src/styles/global.css`, sin borrar nada existente)

Paleta «Profundidad» (la elegida por defecto en el artboard):

```css
:root,
[data-theme="light"] {
  --fx-h1: 182;            /* teal */
  --fx-h2: 230;            /* cian */
  --fx-h3: 296;            /* violeta */
  --fx-l: 60%;             /* lightness del gradiente en claro */
  --fx-grad: linear-gradient(92deg,
    oklch(var(--fx-l) 0.14 var(--fx-h1)),
    oklch(var(--fx-l) 0.15 var(--fx-h2)),
    oklch(var(--fx-l) 0.17 var(--fx-h3)));
}
[data-theme="dark"] {
  --fx-l: 78%;
  --fx-grad: linear-gradient(92deg,
    oklch(var(--fx-l) 0.14 var(--fx-h1)),
    oklch(var(--fx-l) 0.15 var(--fx-h2)),
    oklch(var(--fx-l) 0.17 var(--fx-h3)));
}
```

Ojo: los bloques de tema daisyUI del archivo usan `@plugin "daisyui/theme"` con `name: "light"`
y `name: "dark"`. Añadí estos overrides **fuera** de esos bloques, en `:root`/`[data-theme=...]`
propios, siguiendo la convención del archivo (que ya usa `[data-theme="dark"] .surface-card:hover`
y `.theme-icon-sun` así). Mantené los tokens daisyUI intactos: el acento del sitio sigue siendo
el teal `--color-accent` (oklch hue ~183) para enlaces y foco.

## Animaciones nuevas (en `src/styles/global.css`, junto a las existentes)

```css
@keyframes fx-line-rise { from { transform: translateY(110%); } to { transform: translateY(0); } }
@keyframes fx-blur-rise {
  from { opacity: 0; transform: translateY(28px); filter: blur(8px); }
  to   { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes fx-sheen { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
@keyframes fx-float { from { transform: translate(0,0) scale(1); } to { transform: translate(-6%,10%) scale(1.12); } }
@keyframes fx-fall { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.4); } }
```

Reveal (patrón `html.js` como el `card-reveal` existente, para que sin JS todo sea visible):

```css
html.js [data-fx-reveal] { opacity: 0; transform: translateY(28px); filter: blur(8px); }
html.js [data-fx-reveal].is-visible {
  animation: fx-blur-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
}
html.js [data-fx-line] { overflow: hidden; }
html.js [data-fx-line] > span { display: inline-block; transform: translateY(110%); }
html.js [data-fx-line].is-visible > span {
  animation: fx-line-rise 1s cubic-bezier(0.16,1,0.3,1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
}
```

`prefers-reduced-motion: reduce` ya está global en el archivo (colapsa animaciones a 0.01ms y
`animation-iteration-count: 1`): verificá que con movimiento reducido el texto **queda visible**
(el `forwards` de las animaciones termina en el estado final; no dejes opacidad 0 permanente).

## Estructura de `src/components/Home.astro`

Página = paneles `position: sticky` de 100vh apilados (el artboard): hero + un panel por proyecto
+ contacto. `getCollection("projects")` con el mismo filtro y orden de `Projects.astro`
(drafts fuera, `featured` primero, luego `publishDate` descendente).

### Panel hero — `<section id="sobre-mi">`

- **OJO — el orden de los hijos importa para los tests.** `#sobre-mi` debe tener exactamente:
  un `<div>` (el bloque de foto) y otro `<div>` (el bloque de texto). El `<div>` de texto debe
  tener como hijos directos: `<h1>`, `<p>` (el título del perfil), `<div class="bio-texto">`,
  y nada más que sea `<p>`. El `<p>` del título del perfil NO puede estar dentro de otro div.
- `<h1>` (ÚNICO en la página) con texto exactamente `Carlos Fontán`. Podés partirlo en dos
  spans con styling por línea (`<span>Carlos</span> <span>Fontán</span>` con un espacio entre
  ellos), pero el `textContent` normalizado debe dar `Carlos Fontán`. Uppercase por CSS
  (`text-transform: uppercase`), no por HTML.
- `<p>` = `profileData.title` = `Desarrollador Software IT/OT · IoT Industrial · Automatización`
  (de `src/config/profile.json`).
- Foto: `src/assets/photo.webp` con el componente `Image` de `astro:assets`, `alt={profile.photoAlt}`
  (= `Foto de Carlos Fontán`), exactamente 1 en la página. Estilo: `mask mask-squircle` (ya usado
  en `ProfileDescription.astro`).
- Bio: **3 `<p>`** dentro de `<div class="bio-texto">`, con los textos EXACTOS que salen de
  `src/config/profile.json` — no los escribas a mano, reimplementá la lógica de
  `ProfileDescription.astro` (segmentos con `paragraphBreakBefore` abren párrafo; los
  `emphasis: true` van dentro de `<span class="italic font-semibold">` con `set:text`).
  Resultado esperado: 3 párrafos y 3 spans `.italic`.
  Los spans `.italic` deben conservar el texto exacto de los segmentos emphasis.
- Email de contacto: `fgjcarlos@gmail.com` (de `src/config/profile.json`/links) como enlace
  `mailto:` visible.

### Paneles de proyecto — `<section id="proyectos">`

Un `<article>` por proyecto (4 en total), cada uno un panel sticky de 100vh:

- Título del proyecto como `<h2>` (NO `<p>`): texto exacto de `p.data.title`.
- Descripción: **exactamente un `<p>`** por article, texto exacto de `p.data.description`.
  Ningún otro `<p>` dentro del article (los tags van como `<span>`/`<li>`).
- Estado: un elemento con texto EXACTO `p.data.status` (`alpha` / `beta`), nada más dentro de
  ese elemento (el texto debe hacer match exacto). Usá el badge outline existente
  (`badge badge-outline badge-warning text-warning-content` / `badge-info text-warning-content`).
- Tags: `<span>` (o `<li>`) con `p.data.tags` — nunca `<p>`.
- Enlaces: detalle → `/projects/${p.id}` con texto `Ver detalle →`; `Repo` →
  `p.data.github` y `Demo` → `p.data.demo`, ambos `target="_blank" rel="noopener noreferrer"`,
  con texto EXACTO `Repo` y `Demo` (para que `getByRole("link", {name: "Repo"})` resuelva).
- Numeración `01`–`04` y los títulos:.display grande como en el artboard. Para el número grande
  con contorno (`-webkit-text-stroke`), hacelo decorativo: el número puede ser `<span
  aria-hidden="true">`, pero cuidado: si lo metés dentro del `<article>`, no rompas los tests de
  texto (ver abajo).

### Contacto — `<footer id="contacto">` o `<section id="contacto">`

- Exactamente UN elemento con `id="contacto"` en toda la página (hoy está en
  `ProfileLinks.astro`, que deja de usarse → no queda duplicado).
- Enlaces desde `src/config/links.json`: mail (mailto), GitHub, LinkedIn. Los http con
  `target="_blank" rel="noopener noreferrer"`.
- `© {año}`.

## Scripts (en `src/components/Home.astro`, `<script>` normal de Astro)

Cliente Router activo → todo con el patrón `astro:page-load` como el `NavBar.astro` actual
(re-vincular tras cada navegación; usar `data-` attributes como flags para no duplicar handlers).

1. **Reveal por IntersectionObserver**: `[data-fx-reveal]` y `[data-fx-line]` reciben
   `.is-visible` al entrar en viewport, con `--reveal-delay` escalonado (0/80/160/240 ms).
   Sin `IntersectionObserver` → añadir `.is-visible` a todo.
2. **Barra de progreso**: elemento fijo superior (`data-fx-progress`) con `width` =
   `scrollTop / (scrollHeight - clientHeight) * 100%`, fondo `--fx-grad`.
3. **Stack cinematográfico**: cada panel (salvo el último) se escala a ~0.93 y se atenúa
   (`filter: brightness()`) a medida que el panel siguiente lo tapa; `transform-origin: top center`.
   Medí con `getBoundingClientRect()` del panel siguiente. Todo en un único `requestAnimationFrame`
   con listener de scroll pasivo.
4. **Parallax de blobs**: cada blob decorativo se desplaza verticalmente más lento que el scroll.
5. **Enlaces magnéticos**: en `.fx-links a`, el enlace se desplaza un poco hacia el cursor
   (`pointer: fine` + sin `prefers-reduced-motion`). Reset al salir.

Si `prefers-reduced-motion: reduce` → no montes 3/4/5 (o montalos inertes), y nada queda
invisible: el reveal por IO debe resolverse a visible.

## Estética (artboard → stack real)

- Tipografía: SOLO la del proyecto (`--font-display`: "LXGW WenKai Mono TC", monospace). Nada de
  `system-ui` / sans: el artboard usaba sans display, pero el sistema del proyecto es mono.
  Para el título gigante usá `font-weight: 700` (o 800), `letter-spacing` negativo, `clamp()` de
  tamaño y `text-transform: uppercase`.
- Layout de los paneles: cada panel `min-height: 100vh` (o `h-screen`), `position: sticky`,
  `top: 0`, `display: flex`, con el contenido en un contenedor centrado con padding lateral
  generoso (el artboard usa ~7vw) y `z-index` creciente para que el panel nuevo tape al anterior.
- Blob decorativo por panel: `position:absolute`, `border-radius:50%`, `filter: blur(70px)`,
  gradiente radial con los hues de la paleta, `mix-blend-mode: multiply` en claro y `screen` en
  oscuro, `pointer-events:none`, `aria-hidden="true"`.
- Vidrio (nav, badges, barra): `background: color-mix(in oklch, var(--color-base-100) 70%, transparent)`,
  `backdrop-filter: blur(14px)`, `border: 1px solid var(--color-base-300)`, `border-radius: 9999px`.
- Grano: textura sutil con `background-image` SVG inline (data URI con `feTurbulence`), opacidad
  ~0.05, `pointer-events: none`, `position: fixed`. Sin imágenes externas.
- Gradiente: usarlo en elementos decorativos (barra de progreso, blobs, subrayados, badges).
  **Cuidado con `color-contrast` de axe**: si pintás texto con `-webkit-background-clip: text` +
  `color: transparent`, axe puede marcarlo. Preferí: títulos en `--color-base-content` (o
  `--color-accent` en oscuro, que tiene contraste AA sobre `--color-base-100`) y el color del
  gradiente en la barra, los blobs y un subrayado decorativo. Verificá con el test de a11y.

## Contratos e2e (NO editables — deben pasar sin cambios)

Leé `e2e/homepage-copy.spec.ts`, `e2e/homepage-improvements.spec.ts`, `e2e/anchor-scroll.spec.ts`,
`e2e/smoke.spec.ts`, `e2e/mobile-nav.spec.ts` antes de escribir. Puntos que fijan:

- Un solo `<h1>` en la home, texto `Carlos Fontán`.
- `#sobre-mi > div > p` con texto `Desarrollador Software IT/OT · IoT Industrial · Automatización`.
- `#sobre-mi .bio-texto > p` → 3 párrafos con texto exacto (del profile.json).
- `#sobre-mi img[alt="Foto de Carlos Fontán"]` → exactamente 1.
- `#proyectos article` → 4; en cada uno: 1 solo `<p>` (la descripción), título por texto exacto,
  estado por texto exacto (1 match), enlaces con nombre accesible `Repo` y `Demo` y href exacto.
- Anclas `#sobre-mi`, `#proyectos`, `#contacto`: 1 cada una, con `scroll-margin-top` distinto de 0
  (la regla global `[id]` del `global.css` lo cubre: no la rompas).
- Nav: `<nav>` único en la página (no sumes otro `<nav>`), link de marca con nombre accesible
  `FGJCARLOS` y `href="/"`, sin heading dentro. `nav > ul > li > a` → exactamente 3 (desktop);
  el menú móvil sigue siendo `<details data-mobile-nav-menu>` con `<summary role="button">` y el
  `dropdown-content` que se abre/cierra (el script actual de `NavBar.astro` se conserva).
- `a[target="_blank"][rel*="noopener"]` ≥ 1 en la home.
- axe WCAG2AA: **cero** violaciones de `color-contrast` en la home a 1440×1000 y 390×844.
- `html` con `scroll-behavior: smooth` en claro, `auto` con `prefers-reduced-motion: reduce`.
- La página de proyecto y el 404 siguen igual (no romperlos con el cambio de `Layout`).

## Checks (reportá exit code de cada uno)

1. `pnpm lint`
2. `pnpm check`
3. `pnpm build`
4. `pnpm test:e2e`

Si los browsers de Playwright no están instalados, reportalo (no instales nada).
Arreglá lo que falle dentro de tus archivos; si algo no se puede arreglar ahí, reportalo exacto.
**No hagas commit.**

## Informe final

- Archivos cambiados, una línea cada uno.
- Resultado de los 4 checks (exit code) + texto literal de los asserts que fallen.
- Qué contrato no pudiste cumplir y por qué.
- Qué decidiste distinto del artboard (tipografía mono, gradiente en decorativos, etc.).

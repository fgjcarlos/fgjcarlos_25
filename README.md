# fgjcarlos.com

Portfolio personal de **Carlos Fontán** — desarrollador software con base técnica en automatización industrial, robótica e integración IT/OT.

Sitio publicado en [fgjcarlos.com](https://fgjcarlos.com).

## Stack

- [Astro 5](https://astro.build/) — generación estática + Content Collections (MDX)
- [Tailwind CSS 4](https://tailwindcss.com/) vía `@tailwindcss/vite`
- [DaisyUI 5](https://daisyui.com/) — componentes sobre Tailwind
- [astro-icon](https://github.com/natemoo-re/astro-icon) con `@iconify-json/arcticons`
- [@fontsource/lxgw-wenkai-mono-tc](https://fontsource.org/fonts/lxgw-wenkai-mono-tc) — subsets `latin` + `latin-ext`
- [Sharp](https://sharp.pixelplumbing.com/) — pipeline de imágenes del componente `<Image>` de Astro
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights) + View Transitions (`ClientRouter`)
- TypeScript, ESLint (flat config), Prettier, Playwright
- pnpm 11.1.1, Node 24

## Estructura

```
src/
├── components/      NavBar, Footer, Home, ProfileDescription,
│                    ProfileLinks, FocusAreas, Projects
├── config/          profile.json, links.json
├── content/
│   └── projects/    Content Collection (.mdx + cover image)
├── layouts/
│   └── Layout.astro Layout raíz con SEO, OG, JSON-LD y ClientRouter
├── pages/
│   ├── index.astro
│   ├── 404.astro
│   └── projects/[slug].astro
├── styles/global.css
└── types/config.ts

e2e/                 Smoke tests con Playwright
public/              favicon, og-image, robots.txt
```

### Content Collection `projects`

Cada proyecto es un `.mdx` en `src/content/projects/` con frontmatter validado por Zod:

| Campo         | Tipo                                | Obligatorio |
| ------------- | ----------------------------------- | ----------- |
| `title`       | `string`                            | sí          |
| `description` | `string`                            | sí          |
| `publishDate` | `date`                              | sí          |
| `tags`        | `string[]`                          | sí          |
| `image`       | `image()`                           | no          |
| `github`      | `url`                               | no          |
| `demo`        | `url`                               | no          |
| `status`      | `"alpha" \| "beta" \| "stable"`     | no          |
| `featured`    | `boolean` (default `false`)         | no          |
| `draft`       | `boolean` (default `false`)         | no          |

## Comandos

| Comando             | Acción                                         |
| ------------------- | ---------------------------------------------- |
| `pnpm install`      | Instala dependencias                           |
| `pnpm dev`          | Dev server en `localhost:4321`                 |
| `pnpm build`        | Build de producción a `./dist/`                |
| `pnpm preview`      | Sirve el build local                           |
| `pnpm check`        | `astro check` (type-check de `.astro` y `.ts`) |
| `pnpm lint`         | ESLint sobre `src/`                            |
| `pnpm format`       | Prettier — escribe                             |
| `pnpm format:check` | Prettier — verifica                            |
| `pnpm test:e2e`     | Playwright (smoke sobre el preview build)      |

## SEO y metadatos

`Layout.astro` emite, sobre cada página:

- `<meta>` Open Graph y Twitter Card (`summary_large_image`) con `og-image.png` 1200×630
- JSON-LD `schema.org/Person` con `sameAs` derivado de `src/config/links.json`
- Sitemap automático (`@astrojs/sitemap`) generado en build

## Deploy

Desplegado en Vercel. `vercel.json` define:

- CSP estricta (`default-src 'self'`, `script-src` solo con Vercel Scripts inline-permitido)
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` con `camera`, `microphone`, `geolocation` deshabilitados
- `Cache-Control: public, max-age=31536000, immutable` para `/_astro/*`

## CI

`.github/workflows/ci.yml` corre en `push` y `pull_request` contra `main`:

1. **build** — `pnpm install` → `astro check` → `eslint` → `prettier --check` → `astro build`
2. **e2e** — instala browsers de Playwright y corre los smoke tests sobre el build

Ambos jobs usan Node 24 y cachean el store de pnpm.

## Testing

`e2e/smoke.spec.ts` cubre la ruta crítica del home:

- Título de página
- Imagen de perfil renderizada
- Enlaces sociales con `href` válido y `target="_blank"`
- Anchor de navegación presente
- Sección de proyectos no rompe (puede estar vacía si todos son draft)
- `404.astro` responde con status 404

Playwright arranca el preview build automáticamente (`pnpm build && pnpm preview`).

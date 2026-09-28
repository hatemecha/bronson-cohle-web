# Bronson Cohle - guía para agentes

Archivo textos personales. No es un producto ni un kit para reutilizar los textos. Código bajo MIT; textos en `src/textos/` © Bronson Cohle, todos los derechos reservados. Idioma del sitio: español rioplatense (voseo en UI y documentación).

## Límites del agente

- **No crear ni editar** el cuerpo de `src/textos/*.md`. Los textos los escribe el humano.
- **Sí puede** tocar templates, CSS, JS, config de Eleventy, imágenes de chrome, scripts y datos del sitio.
- Si piden un texto nuevo: no inventar prosa. Pedir el contenido al humano o, si ya lo aportó, limitarse a cablear estructura (frontmatter, imagen, related) sin reescribir.

## Diseño (ledger)

Oscuro por defecto. Estética de archivo / ledger: bordes finos (`1px`), sin color de acento, sin cards, pills, sombras ni emojis en la UI.

| Rol | Fuente |
|-----|--------|
| Prosa y títulos | Source Serif 4 |
| Chrome (nav, meta, controles) | IBM Plex Mono |

Extender tokens en `src/css/main.css`; no inventar un sistema paralelo. Interacción por subrayado y contraste, no por botones decorativos.

**Acerca** se mantiene mínimo: retrato, *Mori Somnia Non Memorias*, enlace al changelog. No convertirlo en página de marketing.

## Producto que no se rompe

- Panel **Aa**: tema, tamaño de fuente, modo lectura (`src/_includes/partials/reading-controls.njk`).
- FOUC prevention en `src/_includes/layouts/base.njk`; preferencias en `localStorage` (`bc-theme`, `bc-font-size`, `bc-reading`).
- **Pagefind** indexa solo `.texto-body`; el resto del chrome lleva `data-pagefind-ignore`.
- Sin analítica, cookies ni scripts de terceros.
- URLs siempre con `| url` o `absoluteUrl`. Dominio canónico en raíz (`bronsoncohle.xyz`); `PATH_PREFIX` solo si hace falta un subpath.

## Changelog (solo código, diseño y configuración)

`src/_data/changelog.json` registra **cómo cambia el sitio**, no qué se publica en él. Es el registro de la estructura que sostiene los textos, no un feed de contenidos.

Entrada nueva al **inicio** del array, y **únicamente** si el commit toca código, diseño o configuración:

| Cambio | ¿Entrada? |
|--------|-----------|
| Agregar, editar o borrar un texto en `src/textos/` | **No** |
| Cambiar la imagen o el frontmatter de un texto | **No** |
| Templates, CSS, JS, config de Eleventy, scripts | **Sí** |
| Rutas nuevas, nav, footer, sitemap | **Sí** |
| Copy de interfaz, SEO, 404, el changelog mismo | **Sí** |

Agregar un texto **no** es un cambio de sitio. Una entrada cuya única novedad sea un texto nuevo es un error, aunque el commit se publique.

```json
{
  "version": "1.0.3",
  "date": "2026-09-08",
  "text": "Descripción breve en español.",
  "description": "Opcional. Solo en /changelog/; la home muestra solo text."
}
```

- `date`: `YYYY-MM-DD`
- `text`: una línea que describa el **código** que cambió. Aparece en la home (3 primeras entradas), así que está amplificado: no es lugar para anunciar textos
- `description`: opcional; texto extendido solo en la página `/changelog/`. Tampoco para anunciar textos
- La home muestra las 3 primeras entradas (`text` únicamente); mantener coherencia
- No hay que sincronizar con `package.json`: va por separado y no se muestra

### Semver

| Tipo | Cuándo |
|------|--------|
| **patch** | Arreglos (lo habitual) |
| **minor** | Feature nueva de sitio |
| **major** | Sitio terminado o refactor enorme de diseño y funcionamiento |

## Rutas y descubrimiento

| Página | Dónde aparece |
|--------|---------------|
| Archivo, Azar, Buscar | Header |
| Acerca de | Footer y sitemap — **no** en header |
| Changelog | Home (teaser), Acerca, sitemap |

Al agregar una ruta nueva: revisar nav, footer y `src/sitemap.xml.njk`.

## Textos (referencia — no escribir)

Frontmatter en `src/textos/*.md`:

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| `title` | sí | Título con tildes |
| `date` | sí | `YYYY-MM-DD` |
| `id` | sí | `BC-NNNN` (catálogo visible) |
| `image` | no | `{ alt, width, height }`; archivo en `src/images/textos/{slug}.webp` |
| `related` | no | Array de slugs (`el-olvido`, no el id) |

Slug = nombre del archivo sin extensión, kebab-case sin tildes. Layout y permalink vienen de `src/textos/textos.11tydata.js`.

## Verificación

Tras cambios de sitio: `npm run check`. Imágenes nuevas de contenido: `npm run optimize:images`.

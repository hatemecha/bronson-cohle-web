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

## Changelog (solo si cambia el sitio)

`src/_data/changelog.json` registra **cómo cambia el sitio**, no qué se publica en él. Es el registro de la estructura que sostiene los textos, no un feed de contenidos.

La prueba es una sola: **¿el commit cambia lo que el sitio es o lo que sirve a un visitante?** Si sí, entrada nueva al **inicio** del array. Si no, no hay entrada.

| Cambio | ¿Entrada? |
|--------|-----------|
| Agregar, editar o borrar un texto en `src/textos/` | **No** |
| Cambiar la imagen o el frontmatter de un texto | **No** |
| Higiene de repo: `.gitattributes`, `.editorconfig`, `.gitignore` | **No** |
| Entorno local: git config, shell, perfiles, Node | **No** |
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

## Entorno (Windows)

El harness lanza **Windows PowerShell 5.1**, no pwsh. pwsh 7.6 está instalado y es el shell interactivo por defecto (Windows Terminal), pero el harness sigue entrando por 5.1.

- `npm` funciona en ambas versiones: la política de ejecución es `RemoteSigned` (scope `CurrentUser`). No hace falta `npm.cmd`.
- El `PSModulePath` de 5.1 se repara solo desde el perfil de `Documents\WindowsPowerShell\profile.ps1`. Si `Get-ExecutionPolicy` o `Get-Acl` fallan con errores de TypeData, es que se saltó el perfil: usar `-NoProfile` es la causa, no la solución.
- **5.1 tiene un paso de argumentos nativo pésimo**: los mensajes de commit con comillas internas o acentos se parten solos. Para esos, escribir el mensaje a un archivo UTF-8 **sin BOM** y usar `git commit -F`:

  ```powershell
  [System.IO.File]::WriteAllText("$env:TEMP\m.txt", 'Mensaje con "comillas" y ñ')
  git commit -F "$env:TEMP\m.txt"
  ```

  `Set-Content -Encoding utf8` mete BOM y contamina el mensaje. Para mensajes simples en ASCII, `git commit -m` alcanza.
- Los archivos del repo están en **LF** y así se mantienen (`.gitattributes`); no reintroducir CRLF a mano.
- Al reescribir un archivo con el tool de edición, el working tree puede quedar en CRLF aunque el índice esté en LF. No es un error: `git status` sigue limpio.

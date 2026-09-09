# Bronson Cohle

Textos personales. Sitio estático con Eleventy y Pagefind.

Sitio: <https://bronsoncohle.xyz>

No es un producto ni un kit para reutilizar los textos.

## Requisitos

- Node.js 20 o superior (el build de GitHub Pages usa 22)
- npm 10 o superior

## Desarrollo

```bash
npm ci
npm run dev
```

Servidor local: `http://localhost:8080`.

`npm run build` genera `dist/` e indexa Pagefind. `npm run dev` no reindexa Pagefind en cada cambio: solo sirve el sitio con recarga automática (la búsqueda aparece tras un build completo).

Para un fork, cambiá `src/_data/site.json` (`url`, nombre, autor), el contenido de `src/CNAME` y, si publicás en un subpath de `*.github.io`, `PATH_PREFIX` en `.github/workflows/pages.yml`.

## Verificación

```bash
npm run check
```

Valida el frontmatter de los textos (title, id, fechas, related, imágenes), genera `dist/`, indexa Pagefind y comprueba los archivos y enlaces locales necesarios para publicar.

El sitio canónico vive en la raíz del dominio (`PATH_PREFIX` por defecto: `/`).

## Imágenes

`npm run optimize:images` convierte los PNG de contenido (`src/images/` y `src/images/textos/`) a WebP y regenera los assets derivados del icono maestro (`favicon.png`): favicon 32px, apple-touch-icon 180px, `src/images/og.png` y `src/images/home-mark.png`.

Los PNG originales se conservan. Si querés eliminarlos después de convertir, corré `npm run optimize:images -- --delete-original`.

## Publicación

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) valida cada pull request y publica cada push a `main`.

### GitHub Pages

1. **Settings > Pages**
2. **Build and deployment:** GitHub Actions
3. **Custom domain:** `bronsoncohle.xyz`
4. Activá **Enforce HTTPS** cuando GitHub lo permita (tras el DNS)
5. Push a `main` y esperar **Build and deploy GitHub Pages**

El archivo `src/CNAME` se copia a `dist/` en el build para que Pages conserve el dominio.

### DNS en Porkbun

En el panel DNS de `bronsoncohle.xyz`, apuntá el apex y `www` a GitHub Pages. Preferí registros A/AAAA en apex (y CNAME de `www` al apex o al host de Pages que indique GitHub):

```
A     @ → 185.199.108.153
A     @ → 185.199.109.153
A     @ → 185.199.110.153
A     @ → 185.199.111.153
AAAA  @ → 2606:50c0:8000::153
AAAA  @ → 2606:50c0:8001::153
AAAA  @ → 2606:50c0:8002::153
AAAA  @ → 2606:50c0:8003::153
```

La propagación puede tardar minutos u horas. Cuando GitHub marque el dominio como verificado, Enforce HTTPS suele activarse solo.

No hay secrets ni variables de entorno. Si cambia el dominio, actualizá `src/_data/site.json` (`url`), `src/CNAME` y la custom domain en Pages.

Rollback: revertir el commit en `main`. El workflow vuelve a publicar. También se puede disparar a mano desde **Actions**.

## Privacidad

No hay analítica, cookies ni servicios de terceros en el sitio publicado.

Las preferencias de lectura (tema, tamaño de fuente, modo lectura) quedan en `localStorage` del navegador. La búsqueda corre en el cliente con Pagefind.

## Contribuir

Los textos no se aceptan por pull request.

Un issue o un PR chico por un error del sitio (build, enlace, accesibilidad) está bien. No hay plazos de respuesta.

## Licencia

El código original está bajo [MIT](LICENSE).

Los textos en `src/textos/` son © Bronson Cohle. Todos los derechos reservados: se pueden leer acá; no se pueden republicar ni adaptar sin permiso.

Las imágenes en `src/images/` (y el icono maestro `favicon.png`) son © Bronson Cohle. Todos los derechos reservados.

Las fuentes en `src/fonts/` siguen la [SIL Open Font License 1.1](src/fonts/OFL.txt).

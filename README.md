# Bronson Cohle

Textos personales. Sitio estático con Eleventy y Pagefind.

Sitio: <https://hatemecha.github.io/bronson-cohle-web/>

Lo mantiene hatemecha. No es un producto ni un kit para reutilizar los textos.

## Requisitos

- Node.js 20 o superior (el build de GitHub Pages usa 22)
- npm 10 o superior

## Desarrollo

```bash
npm ci
npm run dev
```

Servidor local: `http://localhost:8080`.

La búsqueda usa Pagefind y solo existe después de un build completo (`npm run build`). `npm run dev` no reindexa en cada cambio.

Para un fork, cambiá `src/_data/site.json` (`url`, `github`, nombre, autor) y `PATH_PREFIX` en `.github/workflows/pages.yml`.

## Verificación

```bash
npm run check
```

Genera `dist/`, indexa Pagefind y comprueba los archivos necesarios para publicar.

Para reproducir el build de GitHub Pages en PowerShell:

```powershell
$env:PATH_PREFIX = "/bronson-cohle-web/"
npm run check
Remove-Item Env:PATH_PREFIX
```

## Publicación

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) valida cada pull request y publica cada push a `main`.

Configuración única en GitHub:

1. **Settings > Pages**
2. **Build and deployment:** GitHub Actions
3. Push a `main` y esperar **Build and deploy GitHub Pages**

No hay secrets ni variables de entorno. Si cambia el nombre del repositorio, actualizá `PATH_PREFIX` en el workflow y `url` en `src/_data/site.json`.

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

Las fuentes en `src/fonts/` siguen la [SIL Open Font License 1.1](src/fonts/OFL.txt).

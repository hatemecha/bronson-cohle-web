# Bronson Cohle

Textos personales. Sitio estático con Eleventy.

## Requisitos

- Node.js 18+

## Desarrollo

```bash
npm install
npm run dev
```

El servidor local corre en `http://localhost:8080`. Para búsqueda funcional, ejecutá un build completo al menos una vez (`npm run build`).

## Build

```bash
npm run build
```

Genera el sitio en `dist/` e indexa el contenido con Pagefind.

## URL base

Editá `src/_data/site.json` y cambiá `url` antes de publicar (canonical, RSS, Open Graph).

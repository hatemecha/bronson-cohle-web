import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("dist");
const expectedPrefix = process.env.PATH_PREFIX || "/";
const requiredFiles = [
  ".nojekyll",
  "CNAME",
  "index.html",
  "404.html",
  "archivo/index.html",
  "azar/index.html",
  "buscar/index.html",
  "acerca/index.html",
  "changelog/index.html",
  "feed.xml",
  "sitemap.xml",
  "robots.txt",
  "css/main.css",
  "js/main.js",
  "fonts/source-serif-4-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "favicon.png",
  "apple-touch-icon.png",
  "images/og.png",
  "images/home-mark.png",
  "pagefind/pagefind.js",
];

const failures = [];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(outputDir, relativePath));
  } catch {
    failures.push(`Falta dist/${relativePath}`);
  }
}

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "pagefind") {
      files.push(...await collectHtml(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(entryPath);
    }
  }

  return files;
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function stripReference(value) {
  const withoutFragment = value.split("#")[0];
  return withoutFragment.split("?")[0];
}

async function resolveLocalFile(htmlFile, reference, expectedPrefix) {
  let relativePath;
  if (reference.startsWith("/")) {
    if (expectedPrefix !== "/") {
      if (!reference.startsWith(expectedPrefix)) return;
      relativePath = reference.slice(expectedPrefix.length);
    } else {
      relativePath = reference.slice(1);
    }
  } else {
    const baseDir = path.dirname(htmlFile);
    relativePath = path.relative(outputDir, path.resolve(baseDir, reference));
  }

  if (!relativePath) return;

  const candidates = [
    path.join(outputDir, relativePath),
    path.join(outputDir, relativePath, "index.html"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return;
    } catch {}
  }

  failures.push(`${path.relative(outputDir, htmlFile)}: referencia a ruta inexistente (${reference})`);
}

for (const file of await collectHtml(outputDir)) {
  const html = await readFile(file, "utf8");
  const relativePath = path.relative(outputDir, file).replaceAll("\\", "/");
  const baseAttribute = `data-base-url="${expectedPrefix}"`;

  if (!html.includes(baseAttribute)) {
    failures.push(`${relativePath}: no contiene ${baseAttribute}`);
  }

  const localRootReferences = html.match(/(?:href|src)="\/(?!\/)[^"]*"/g) || [];
  const invalidReferences = expectedPrefix === "/"
    ? []
    : localRootReferences.filter((reference) => !reference.includes(`="${expectedPrefix}`));

  for (const reference of invalidReferences) {
    failures.push(`${relativePath}: referencia fuera del pathPrefix (${reference})`);
  }

  const references = html.match(/(?:href|src)="([^"]+)"/g) || [];
  for (const attr of references) {
    const value = attr.replace(/^(?:href|src)="/, "").replace(/"$/, "");
    if (isExternalUrl(value)) continue;
    const reference = stripReference(value);
    if (!reference) continue;
    await resolveLocalFile(file, reference, expectedPrefix);
  }
}

if (failures.length) {
  console.error("La verificación del build falló:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Build verificado para PATH_PREFIX=${expectedPrefix}`);
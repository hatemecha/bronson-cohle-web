import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("dist");
const expectedPrefix = process.env.PATH_PREFIX || "/";
const requiredFiles = [
  ".nojekyll",
  "index.html",
  "404.html",
  "archivo/index.html",
  "buscar/index.html",
  "feed.xml",
  "sitemap.xml",
  "css/main.css",
  "js/main.js",
  "fonts/source-serif-4-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
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
}

if (failures.length) {
  console.error("La verificación del build falló:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Build verificado para PATH_PREFIX=${expectedPrefix}`);

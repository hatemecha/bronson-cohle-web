import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const textosDir = path.resolve("src", "textos");
const imagesDir = path.resolve("src", "images", "textos");

const failures = [];
const seenIds = new Set();
const seenSlugs = new Set();

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function frontmatter(content) {
  const normalized = String(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const body = match[1];
  const data = {};
  for (const line of body.split("\n")) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      value = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      value = value === "true";
    } else if (value === "null") {
      value = null;
    } else if (/^-?\d+$/.test(value)) {
      value = Number(value);
    } else if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Dejar la fecha como string; se valida abajo
    }
    data[key] = value;
  }

  // Frontmatter YAML multilinea (bloques indentados) se parsea de forma
  // sencilla para `image` y `related` (el caso que usa el archivo).
  const blockMatch = body.match(/^(image|related):\s*\n(\s+.*(?:\n\s+.*)*)$/m);
  if (blockMatch) {
    const key = blockMatch[1];
    const block = blockMatch[2];
    if (key === "image") {
      data.image = {};
      for (const line of block.split("\n")) {
        const m = line.match(/^\s+(alt|width|height|file):\s*(.*)$/);
        if (!m) continue;
        const k = m[1];
        let v = m[2].trim();
        if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
        if (k === "width" || k === "height") v = Number(v);
        data.image[k] = v;
      }
    } else if (key === "related") {
      data.related = block
        .split("\n")
        .map((line) => line.match(/^\s*-\s*(.*)$/))
        .filter(Boolean)
        .map((m) => m[1].trim().replace(/['"]/g, ""));
    }
  }

  return data;
}

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(value);
}

const files = (await readdir(textosDir)).filter((name) => name.endsWith(".md"));

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  seenSlugs.add(slug);
}

for (const file of files) {
  const filePath = path.join(textosDir, file);
  const slug = file.replace(/\.md$/, "");
  const raw = await readFile(filePath, "utf8");
  const fm = frontmatter(raw);

  if (!fm.title || typeof fm.title !== "string" || !fm.title.trim()) {
    failures.push(`${file}: falta "title" (obligatorio)`);
  }

  if (!fm.date) {
    failures.push(`${file}: falta "date" (obligatorio)`);
  } else {
    const d = toDate(fm.date);
    if (Number.isNaN(d.getTime())) {
      failures.push(`${file}: "date" no es una fecha válida`);
    }
  }

  for (const optionalDate of ["published", "updated"]) {
    if (fm[optionalDate] !== undefined) {
      const d = toDate(fm[optionalDate]);
      if (Number.isNaN(d.getTime())) {
        failures.push(`${file}: "${optionalDate}" no es una fecha válida`);
      }
    }
  }

  if (!fm.id) {
    failures.push(`${file}: falta "id" (obligatorio)`);
  } else if (!/^BC-\d{4}$/.test(String(fm.id))) {
    failures.push(`${file}: "id" debe tener formato BC-NNNN`);
  } else if (seenIds.has(fm.id)) {
    failures.push(`${file}: "id" ${fm.id} está duplicado`);
  } else {
    seenIds.add(fm.id);
  }

  if (fm.related) {
    if (!Array.isArray(fm.related)) {
      failures.push(`${file}: "related" debe ser una lista`);
    } else {
      for (const relatedSlug of fm.related) {
        if (!seenSlugs.has(relatedSlug)) {
          failures.push(`${file}: "related" apunta a "${relatedSlug}", que no existe`);
        }
      }
    }
  }

  if (fm.image) {
    if (typeof fm.image !== "object" || Array.isArray(fm.image)) {
      failures.push(`${file}: "image" debe ser un objeto { alt, width, height }`);
      continue;
    }

    const imageFile = fm.image.file || `${slug}.webp`;
    const imageSource = path.join(imagesDir, imageFile);

    if (!(await exists(imageSource))) {
      failures.push(`${file}: imagen "${imageFile}" no existe en src/images/textos/`);
    }

    if (fm.image.width !== undefined && !Number.isInteger(fm.image.width)) {
      failures.push(`${file}: "image.width" debe ser un número entero`);
    }
    if (fm.image.height !== undefined && !Number.isInteger(fm.image.height)) {
      failures.push(`${file}: "image.height" debe ser un número entero`);
    }
  }
}

if (failures.length) {
  console.error("La validación del contenido falló:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Contenido validado: ${files.length} textos, ${seenIds.size} ids, sin errores.`);
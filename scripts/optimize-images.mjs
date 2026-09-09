import { access, mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(".");
const contentMaxWidth = 1280;
const contentMaxHeight = 1280;
const webpQuality = 78;
const heavyBytes = 180 * 1024;
const deleteOriginal = process.argv.includes("--delete-original");
const force = process.argv.includes("--force");

const results = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeToWebpBuffer(sourcePath) {
  const image = sharp(sourcePath, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width || contentMaxWidth;
  const height = meta.height || contentMaxHeight;
  const scale = Math.min(1, contentMaxWidth / width, contentMaxHeight / height);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const buffer = await image
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: webpQuality, effort: 6 })
    .toBuffer();

  return { buffer, width: targetWidth, height: targetHeight };
}

async function optimizeContentPng(filePath) {
  const outPath = filePath.replace(/\.png$/i, ".webp");

  if ((await exists(outPath)) && !force) {
    return { outPath, skipped: true };
  }

  const sized = await optimizeToWebpBuffer(filePath);
  await writeFile(outPath, sized.buffer);

  if (deleteOriginal) {
    await unlink(filePath);
  }

  return { outPath, width: sized.width, height: sized.height };
}

async function recompressWebp(filePath) {
  const info = await stat(filePath);
  if (!force && info.size <= heavyBytes) {
    return { outPath: filePath, skipped: true, bytes: info.size };
  }

  const sized = await optimizeToWebpBuffer(filePath);
  await writeFile(filePath, sized.buffer);
  const after = await stat(filePath);
  return {
    outPath: filePath,
    width: sized.width,
    height: sized.height,
    bytes: after.size,
    beforeBytes: info.size,
  };
}

async function writeMasterAssets() {
  const source = path.join(root, "favicon.png");
  if (!(await exists(source))) return;

  const imagesDir = path.join(root, "src", "images");
  await mkdir(imagesDir, { recursive: true });

  const targets = [
    { file: path.join(root, "src", "favicon.png"), size: 32 },
    { file: path.join(root, "src", "apple-touch-icon.png"), size: 180 },
    { file: path.join(imagesDir, "og.png"), size: 1200 },
    { file: path.join(imagesDir, "home-mark.png"), size: 128 },
  ];

  for (const target of targets) {
    await sharp(source)
      .resize(target.size, target.size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true, colors: 16 })
      .toFile(target.file);
  }
}

const imagesRoot = path.join(root, "src", "images");
const textosDir = path.join(imagesRoot, "textos");
const webpFiles = [];

for (const name of await readdir(textosDir)) {
  const file = path.join(textosDir, name);
  if (name.toLowerCase().endsWith(".png")) {
    results.push({
      kind: "texto",
      ...(await optimizeContentPng(file)),
    });
  } else if (name.toLowerCase().endsWith(".webp")) {
    webpFiles.push({ kind: "texto", file });
  }
}

if (await exists(path.join(imagesRoot, "acerca.png"))) {
  results.push({
    kind: "acerca",
    ...(await optimizeContentPng(path.join(imagesRoot, "acerca.png"))),
  });
}
if (await exists(path.join(imagesRoot, "acerca.webp"))) {
  webpFiles.push({ kind: "acerca", file: path.join(imagesRoot, "acerca.webp") });
}

for (const item of webpFiles) {
  try {
    results.push({
      kind: item.kind,
      ...(await recompressWebp(item.file)),
    });
  } catch (error) {
    results.push({
      kind: item.kind,
      outPath: item.file,
      skipped: true,
      error: error.code || error.message,
    });
    console.warn(`No se pudo recomprimir ${path.relative(root, item.file)}: ${error.message}`);
  }
}

try {
  await writeMasterAssets();
} catch (error) {
  console.warn(`No se pudieron regenerar assets maestros: ${error.message}`);
}

const summary = results.map((item) => ({
  file: path.relative(root, item.outPath).replaceAll("\\", "/"),
  width: item.width,
  height: item.height,
  skipped: item.skipped || false,
  beforeKB: item.beforeBytes ? Math.round(item.beforeBytes / 1024) : undefined,
  afterKB: item.bytes ? Math.round(item.bytes / 1024) : undefined,
}));

await writeFile(
  path.join(root, "scripts", "optimize-images.report.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);

console.log(JSON.stringify(summary, null, 2));

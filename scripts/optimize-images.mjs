import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(".");
const contentMaxWidth = 1600;
const contentMaxHeight = 1600;
const deleteOriginal = process.argv.includes("--delete-original");

const results = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeContentPng(filePath) {
  const image = sharp(filePath, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width || contentMaxWidth;
  const height = meta.height || contentMaxHeight;
  const scale = Math.min(1, contentMaxWidth / width, contentMaxHeight / height);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const outPath = filePath.replace(/\.png$/i, ".webp");

  if (await exists(outPath)) {
    return { outPath, width, height, skipped: true };
  }

  await image
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);

  if (deleteOriginal) {
    const { unlink } = await import("node:fs/promises");
    await unlink(filePath);
  }

  return { outPath, width: targetWidth, height: targetHeight };
}

async function writeMasterAssets() {
  const source = path.join(root, "favicon.png");
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

const textoTargets = [
  {
    kind: "acerca",
    png: path.join(root, "src", "images", "acerca.png"),
  },
  ...(await readdir(path.join(root, "src", "images", "textos")))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => ({
      kind: "texto",
      png: path.join(root, "src", "images", "textos", name),
    })),
];

for (const target of textoTargets) {
  if (!(await exists(target.png))) continue;
  results.push({
    kind: target.kind,
    ...(await optimizeContentPng(target.png)),
  });
}

await writeMasterAssets();

const summary = results.map((item) => ({
  file: path.relative(root, item.outPath).replaceAll("\\", "/"),
  width: item.width,
  height: item.height,
  skipped: item.skipped || false,
}));

await writeFile(
  path.join(root, "scripts", "optimize-images.report.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);

console.log(JSON.stringify(summary, null, 2));

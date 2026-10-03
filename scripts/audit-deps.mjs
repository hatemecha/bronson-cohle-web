import { spawnSync } from "node:child_process";

const blockingSeverities = new Set(["high", "critical"]);

// Sin versión parcheada; braces solo llega vía chokidar (watch de `npm run dev`), no al build.
const ignoredAdvisories = new Map([
  ["GHSA-vfj7-8cjw-p6xm", "braces"],
]);

const result = spawnSync("npm audit --json", { encoding: "utf8", shell: true });

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("No se pudo leer la salida de npm audit.");
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const failures = [];
const ignored = [];

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const advisory of vulnerability.via) {
    if (typeof advisory === "string") continue;
    if (!blockingSeverities.has(advisory.severity)) continue;

    const id = advisory.url?.split("/").pop();
    const line = `${advisory.severity} ${advisory.name}: ${advisory.title} (${advisory.url})`;

    if (ignoredAdvisories.get(id) === advisory.name) {
      ignored.push(line);
    } else {
      failures.push(line);
    }
  }
}

for (const line of ignored) {
  console.log(`Ignorado: ${line}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Dependencias sin avisos high/critical pendientes.");

import { execSync } from "node:child_process";

const MONTHS_ES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function dateParts(value) {
  const d = toDate(value);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
  };
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("fonts");

  eleventyConfig.addCollection("textos", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/textos/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("textosChronological", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/textos/*.md")
      .sort((a, b) => a.date - b.date);
  });

  eleventyConfig.addFilter("formatDateShort", (value) => {
    const { day, month, year } = dateParts(value);
    return `${pad(day)}.${pad(month + 1)}.${year}`;
  });

  eleventyConfig.addFilter("formatDateHome", (value) => {
    const { day, month, year } = dateParts(value);
    return `${pad(day)} ${MONTHS_ES[month]} ${year}`;
  });

  eleventyConfig.addFilter("formatDateArchive", (value) => {
    const { day, month } = dateParts(value);
    return `${pad(day)}.${pad(month + 1)}`;
  });

  eleventyConfig.addFilter("formatDateRfc822", (value) => {
    return toDate(value).toUTCString();
  });

  eleventyConfig.addFilter("formatDateIso", (value) => {
    const { day, month, year } = dateParts(value);
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  });

  eleventyConfig.addFilter("yearOf", (value) => {
    return dateParts(value).year;
  });

  eleventyConfig.addFilter("stripHtml", (value) => {
    return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  });

  eleventyConfig.addFilter("excerpt", (content, length = 140) => {
    const text = String(content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const match = text.match(/^(.+?[.!?])(?:\s|$)/);
    const first = match ? match[1] : text;
    if (first.length <= length) return first;
    return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
  });

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return base;
    if (url.startsWith("http")) return url;
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    return `${normalizedBase}${normalizedUrl}`;
  });

  eleventyConfig.addFilter("resolveRelated", (slugs, collections) => {
    if (!slugs || !Array.isArray(slugs)) return [];
    const bySlug = new Map(
      collections.textos.map((item) => [item.fileSlug, item])
    );
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean);
  });

  eleventyConfig.addFilter("prevTexto", (current, collections) => {
    const items = collections.textosChronological;
    const index = items.findIndex((item) => item.url === current.url);
    return index > 0 ? items[index - 1] : null;
  });

  eleventyConfig.addFilter("nextTexto", (current, collections) => {
    const items = collections.textosChronological;
    const index = items.findIndex((item) => item.url === current.url);
    return index >= 0 && index < items.length - 1 ? items[index + 1] : null;
  });

  eleventyConfig.addFilter("xmlEscape", (value) => {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });

  eleventyConfig.on("eleventy.after", () => {
    try {
      execSync("npx pagefind --site dist", { stdio: "inherit" });
    } catch {
      console.warn("[pagefind] Index skipped — run npm run build after first compile.");
    }
  });

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["md", "njk", "html", "xml"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    pathPrefix: "/",
  };
}

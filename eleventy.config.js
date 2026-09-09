const pathPrefix = process.env.PATH_PREFIX || "/";

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

function compareTextos(a, b) {
  const dateDiff = toDate(a.date) - toDate(b.date);
  if (dateDiff !== 0) return dateDiff;
  return a.data.title.localeCompare(b.data.title, "es");
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/fonts": "fonts",
    "src/images": "images",
    "src/favicon.png": "favicon.png",
    "src/apple-touch-icon.png": "apple-touch-icon.png",
    "src/.nojekyll": ".nojekyll",
  });
  eleventyConfig.setServerPassthroughCopyBehavior("copy");
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  eleventyConfig.addCollection("textos", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/textos/*.md")
      .sort((a, b) => compareTextos(b, a));
  });

  eleventyConfig.addCollection("textosChronological", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/textos/*.md")
      .sort(compareTextos);
  });

  eleventyConfig.addFilter("formatDateShort", (value) => {
    const { day, month, year } = dateParts(value);
    return `${pad(day)}.${pad(month + 1)}.${year}`;
  });

  eleventyConfig.addFilter("formatDateRfc822", (value) => {
    return toDate(value).toUTCString();
  });

  eleventyConfig.addFilter("publishedDate", (item) => {
    const published = item.data && item.data.published;
    return toDate(published || item.date);
  });

  eleventyConfig.addFilter("lastModifiedDate", (item) => {
    const data = item.data || {};
    return toDate(data.updated || data.published || item.date);
  });

  eleventyConfig.addFilter("formatDateIso", (value) => {
    const { day, month, year } = dateParts(value);
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  });

  eleventyConfig.addFilter("yearOf", (value) => {
    return dateParts(value).year;
  });

  eleventyConfig.addFilter("monthKey", (value) => {
    const { month, year } = dateParts(value);
    return `${year}-${pad(month + 1)}`;
  });

  eleventyConfig.addFilter("formatMonthLabel", (value) => {
    const { month } = dateParts(value);
    return MONTHS_ES[month];
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

  eleventyConfig.addFilter("bodyExcerpt", (content, length = 160) => {
    const bodyMatch = String(content).match(/<div class="texto-body"[^>]*>([\s\S]*?)<\/div>/);
    const body = bodyMatch ? bodyMatch[1] : String(content);
    const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return "";

    const sentences = [];
    const sentenceRe = /[^.!?¿¡]+[.!?]+(?:\s|$)|[^.!?¿¡]+$/g;
    let match;
    while ((match = sentenceRe.exec(text)) !== null) {
      const sentence = match[0].trim();
      if (sentence) sentences.push(sentence);
    }

    if (!sentences.length) {
      return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
    }

    // Preferir oraciones completas; si la primera no entra, usar la siguiente corta.
    const fitting = sentences.filter((sentence) => sentence.length <= length);
    if (fitting.length) {
      let excerpt = fitting[0];
      for (let i = 1; i < fitting.length; i += 1) {
        const next = `${excerpt} ${fitting[i]}`;
        if (next.length > length) break;
        excerpt = next;
        if (excerpt.length >= Math.min(110, length)) break;
      }
      return excerpt;
    }

    return `${sentences[0].slice(0, length).replace(/\s+\S*$/, "").replace(/[.,;:¿¡]*$/, "")}…`;
  });

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return base;
    if (url.startsWith("http")) return url;
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    return `${normalizedBase}${normalizedUrl}`;
  });

  function textoImageFilename(value, slug) {
    const file = String(value);
    return file.includes(".") ? file : `${file}.webp`;
  }

  eleventyConfig.addFilter("resolveTextoImage", (image, slug) => {
    if (!image) return null;

    let file;
    let alt = "";
    let width;
    let height;

    if (typeof image === "boolean") {
      file = `${slug}.webp`;
    } else if (typeof image === "string") {
      file = textoImageFilename(image, slug);
    } else if (typeof image === "object") {
      file = image.file ? textoImageFilename(image.file, slug) : `${slug}.webp`;
      alt = image.alt || "";
      width = image.width;
      height = image.height;
    } else {
      return null;
    }

    return {
      src: `/images/textos/${file}`,
      alt,
      width,
      height,
    };
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

  eleventyConfig.addFilter("toJson", (value) => {
    return JSON.stringify(value);
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
    pathPrefix,
  };
}

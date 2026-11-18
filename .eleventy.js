// .eleventy.js (ESM)
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

// Inline SVG icons from src/_includes/icons (see the README there).
const ICON_DIR = new URL("./src/_includes/icons/", import.meta.url);
const iconCache = new Map();
const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function icon(name, label) {
  let svg = iconCache.get(name);
  if (!svg) {
    let raw;
    try {
      raw = readFileSync(new URL(`${name}.svg`, ICON_DIR), "utf8");
    } catch {
      throw new Error(`icon: no such icon "${name}" in src/_includes/icons`);
    }
    svg = raw
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<title>[\s\S]*?<\/title>/g, "")
      .replace(/\s+/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s+(\/?>)/g, "$1")
      // drop sizing/class from the root <svg> only; inner shapes keep theirs
      .replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(class|width|height|role)="[^"]*"/g, ""))
      .trim();
    // filled glyphs (no stroke) take the text colour too
    if (!/\sstroke="/.test(svg)) svg = svg.replace("<svg", '<svg fill="currentColor"');
    iconCache.set(name, svg);
  }
  const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : `aria-hidden="true"`;
  return svg.replace("<svg", `<svg class="icon icon-${name}" ${a11y} focusable="false"`);
}

export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/audio": "assets/audio" });
  eleventyConfig.addPassthroughCopy({ "src/assets/docs": "assets/docs" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon": "/" });
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Images. Every local <img> becomes a WebP srcset (400/800/1600w, never
  // upscaled) with width/height, so pages don't shift as photos load.
  // Set `sizes` on images narrower than the content column, and
  // `eleventy:widths="W,2W"` on photos shown at a fixed width W.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp"],
    widths: [400, 800, 1600],
    htmlOptions: {
      fallback: "smallest",  // width/height from the smallest size, i.e. the 1x size for fixed-width photos
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
        sizes: "(max-width: 880px) calc(100vw - 72px), 860px",
      },
    },
  });

  // Lightbox links point at the full photo; serve a 2000px WebP instead of
  // the camera original (some are 4000px / 6 MB).
  eleventyConfig.htmlTransformer.addPosthtmlPlugin("html", () => async (tree) => {
    const jobs = [];
    tree.match({ tag: "a" }, (node) => {
      const a = node.attrs;
      if (a && "data-lightbox" in a && /^\/[^/].*\.(jpe?g|png|webp)$/i.test(a.href ?? "")) {
        jobs.push(
          Image(`src${decodeURI(a.href)}`, { widths: [2000], formats: ["webp"], outputDir: "_site/img/", urlPath: "/img/" })
            .then((md) => { a.href = md.webp[0].url; }),
        );
      }
      return node;
    });
    await Promise.all(jobs);
    return tree;
  });

  eleventyConfig.addShortcode("icon", icon);

  // A content card: {% card "About", "intro" %}…{% endcard %}
  eleventyConfig.addPairedShortcode("card", (content, label, cls = "") => {
    const heading = label ? `<h2 class="label">${label}</h2>` : "";
    return `<section class="card ${cls}"><div class="frame"><div class="panel">${heading}${content}</div></div></section>`;
  });

  // Click-to-load video players. The page shows a preview with a play button;
  // main.js swaps in the real player (and its scripts and cookies) on click.
  //   {% youtube "videoId", "Accessible title", startSeconds %}
  //   {% twitch "videoId", "Accessible title", "0h2m30s" %}
  const facade = (src, title, kind, thumb = "") =>
    `<button class="facade facade-${kind}" type="button" data-src="${escapeAttr(src)}" data-title="${escapeAttr(title)}" aria-label="${kind === "youtube" ? "YouTube" : "Twitch"}: play ${escapeAttr(title)}">` +
    (thumb ? `<img src="${thumb}" alt="" loading="lazy" decoding="async" eleventy:ignore>` : "") +
    `<span class="facade-play">${icon("play")}</span>` +
    `<span class="facade-label">${icon(kind)}${kind === "youtube" ? "YouTube" : "Twitch"}</span></button>`;
  eleventyConfig.addShortcode("youtube", (id, title, start = "") =>
    facade(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1${start ? `&start=${start}` : ""}`, title, "youtube",
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`));
  // Twitch only plays on the hostnames listed as `parent`
  const TWITCH_PARENTS = ["home.dericilab.live", "dericilab.live", "localhost"].map((h) => `parent=${h}`).join("&");
  eleventyConfig.addShortcode("twitch", (video, title, time = "") =>
    facade(`https://player.twitch.tv/?video=${video}${time ? `&time=${time}` : ""}&autoplay=true&${TWITCH_PARENTS}`, title, "twitch"));

  // A 0–5 star rating: {% stars 4 %}
  eleventyConfig.addShortcode("stars", (n) => {
    const filled = Math.max(0, Math.min(5, Number(n)));
    const star = icon("star");
    const on = star.replace('class="icon icon-star"', 'class="icon icon-star on"');
    return `<span class="stars" role="img" aria-label="${filled} out of 5">${on.repeat(filled)}${star.repeat(5 - filled)}</span>`;
  });

  // A collapsible entry (CV items): {% entry "Title", "2015 – 2021", "optional-id" %}…{% endentry %}
  eleventyConfig.addPairedShortcode("entry", (content, title, when = "", id = "") => {
    const idAttr = id ? ` id="${id}"` : "";
    const date = when ? `<span class="when">${when}</span>` : "";
    return `<details class="entry"${idAttr}><summary>${icon("chevron-right")}<span class="what">${title}</span>${date}</summary><div class="entry-body">${content}</div></details>`;
  });

  // date filter: {{ "now" | date("yyyy") }} or {{ someDate | date("yyyy-LL-dd") }}
  eleventyConfig.addFilter("date", (value, format = "yyyy") => {
    const d = value === "now" ? new Date() : value;
    const jsDate = d instanceof Date ? d : new Date(d);
    return DateTime.fromJSDate(jsDate).toFormat(format);
  });

  // Pretty URLs everywhere by default
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      // If a page already set its own permalink, keep it
      if (typeof data.permalink !== "undefined") return data.permalink;

      // Don't try to permalink non-pages (includes, data files) — Eleventy
      // won’t output those anyway, so this is safe.

      const slug = data.page.fileSlug;
      // Home page
      if (slug === "index") return "/";

      // Everything else: /slug/
      return `/${slug}/`;
    },
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}

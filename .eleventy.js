// .eleventy.js (ESM)
import { DateTime } from "luxon";

export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/audio": "assets/audio" });

  // date filter: {{ "now" | date("yyyy") }} or {{ someDate | date("yyyy-LL-dd") }}
  eleventyConfig.addFilter("date", (value, format = "yyyy") => {
    const d = value === "now" ? new Date() : value;
    const jsDate = d instanceof Date ? d : new Date(d);
    return DateTime.fromJSDate(jsDate).toFormat(format);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}

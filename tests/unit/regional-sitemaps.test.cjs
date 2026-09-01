const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "lib/seo/sitemaps.js"),
  "utf8",
);

test("India sitemap uses only the India hostname", () => {
  const indiaBlock = source.slice(
    source.indexOf("const INDIA_ROUTES"),
    source.indexOf("];", source.indexOf("const INDIA_ROUTES")) + 2,
  );
  assert.match(source, /INDIA_ORIGIN = "https:\/\/in\.ambelpos\.com"/);
  assert.doesNotMatch(indiaBlock, /\/us(?:\/|\")/);
});

test("International sitemap uses www and its public route family", () => {
  assert.match(source, /INTERNATIONAL_ORIGIN = "https:\/\/www\.ambelpos\.com"/);
  assert.match(source, /\["\/", "weekly", 1\]/);
  assert.match(source, /\["\/us\/pricing", "monthly", 0\.8\]/);
});

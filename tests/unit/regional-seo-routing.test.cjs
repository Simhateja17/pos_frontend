const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const middleware = fs.readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
const siteLinks = fs.readFileSync(
  path.join(process.cwd(), "components/marketing/site-links.ts"),
  "utf8",
);

test("regional SEO headers declare canonical and all three alternates", () => {
  assert.match(middleware, /rel=\"canonical\"/);
  assert.match(middleware, /hreflang=\"en-IN\"/);
  assert.match(middleware, /hreflang=\"en-US\"/);
  assert.match(middleware, /hreflang=\"x-default\"/);
});

test("wrong-host marketing duplicates use permanent redirects", () => {
  const permanentRedirects = middleware.match(/NextResponse\.redirect\(target, 308\)/g) ?? [];
  assert.equal(permanentRedirects.length, 3);
});

test("International marketing chrome uses the canonical root homepage", () => {
  const internationalBlock = siteLinks.slice(siteLinks.indexOf("INTL: {"));
  assert.match(internationalBlock, /home: '\/'/);
  assert.match(internationalBlock, /\['How it works', '\/#how'\]/);
  assert.match(internationalBlock, /\['Screens', '\/#screens'\]/);
});

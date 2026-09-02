const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const middleware = fs.readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
const siteLinks = fs.readFileSync(
  path.join(process.cwd(), "components/marketing/site-links.ts"),
  "utf8",
);
const internationalLanding = fs.readFileSync(
  path.join(process.cwd(), "app/us/page.js"),
  "utf8",
);
const indiaLanding = fs.readFileSync(
  path.join(process.cwd(), "app/page.js"),
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

test("explicit /us navigation remembers International before canonical redirect", () => {
  const usRedirect = middleware.slice(
    middleware.indexOf("if (pathname === '/us')"),
    middleware.indexOf("// A regional marketing path"),
  );
  assert.match(usRedirect, /response\.cookies\.set\(REGION_COOKIE, 'INTL'/);
  assert.match(usRedirect, /return response/);
});

test("International landing copy is country-neutral while India copy stays regional", () => {
  assert.match(internationalLanding, /Retail, run from/);
  assert.doesNotMatch(internationalLanding, /US retail, run from|American boutiques|across the US/);
  assert.match(indiaLanding, /GST-native|Indian retail|₹/);
});

#!/usr/bin/env node

/**
 * TWO WILD SOULS — City Listicle Generator
 *
 * Reads data/cities.json + data/categories.json and outputs:
 *   output/[category-slug]/[city-slug]/index.html   → one page per city × category
 *   output/local-guide/index.html                   → hub listing all cities × categories
 *
 * Total pages: 71 cities × 8 categories = 568 entry pages + 1 hub = 569 files
 */

const fs   = require("fs");
const path = require("path");

const CITIES_FILE     = path.join(__dirname, "../data/cities.json");
const CATEGORIES_FILE = path.join(__dirname, "../data/categories.json");
const OUTPUT_ROOT     = path.join(__dirname, "../output");

const SITE_NAME = "Two Wild Souls Photography";
const SITE_URL  = "https://www.twowildsoulsphotography.com";
const GUIDE_URL = "https://maternityguide.twowildsoulsphotography.com";
const QUIZ_URL  = "https://moments.twowildsoulsphotography.com";
const HUB_URL   = `${SITE_URL}/maternity-guide`;

const REGION_LABELS = {
  "metro-detroit": "Metro Detroit",
  "flint":         "Flint Area",
  "bay-city":      "Saginaw Bay Area",
  "northern-mi":   "Northern Michigan",
  "grand-rapids":  "Grand Rapids Area",
  "toledo":        "Toledo Area",
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

// Replace {city}, {state} tokens in template strings
function fill(str, city) {
  return str
    .replace(/\{city\}/g, city.city)
    .replace(/\{state\}/g, city.state);
}

// ─── BRAND CSS (shared) ──────────────────────────────────────────────────────

const BRAND_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#2B1F1A;--ink2:#4A3A34;--ink3:#7A6A63;--ink4:#B0A49C;
  --cream:#FAF7F2;--parch:#F2EDE5;--border:#E6DDD4;
  --rose:#C4856A;--rose-l:#F5EAE4;--sage:#7A9E8A;--gold:#B8945F;
}
body{font-family:'Jost',sans-serif;font-weight:300;background:#fff;color:var(--ink);line-height:1.7;}
h1,h2,h3,h4{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;line-height:1.25;}
a{color:inherit;text-decoration:none;}
.container{max-width:860px;margin:0 auto;padding:0 28px;}
`;

const HEADER_HTML = `
<header style="padding:18px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E6DDD4;flex-wrap:wrap;gap:14px;">
  <a href="${SITE_URL}">
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;letter-spacing:.04em;color:#2B1F1A;">Two Wild Souls</div>
    <div style="font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:#7A6A63;">Photography · Rochester, MI</div>
  </a>
  <a href="${QUIZ_URL}" style="font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:#2B1F1A;color:#FAF7F2;padding:10px 20px;border-radius:2px;white-space:nowrap;">Book a session</a>
</header>`;

const FOOTER_HTML = `
<footer style="border-top:1px solid #E6DDD4;padding:28px;text-align:center;font-size:.7rem;letter-spacing:.07em;color:#B0A49C;margin-top:48px;">
  © ${new Date().getFullYear()} ${SITE_NAME} &nbsp;·&nbsp; 1002 N Main St, Rochester MI 48307 &nbsp;·&nbsp;
  <a href="${SITE_URL}" style="color:#B0A49C;border-bottom:1px solid #E6DDD4;padding-bottom:1px;">twowildsoulsphotography.com</a>
</footer>`;

// ─── CITY × CATEGORY PAGE ────────────────────────────────────────────────────

function buildCityPage(city, cat) {
  const title       = fill(cat.title, city);
  const h1          = fill(cat.h1, city);
  const description = fill(cat.description, city);
  const intro       = fill(cat.intro, city);
  const ctaContext  = fill(cat.cta_context, city);

  const sectionsHTML = cat.sections.map(s => `
    <div style="margin-bottom:36px;">
      <h2 style="font-size:1.3rem;margin-bottom:12px;color:#2B1F1A;">${s.heading}</h2>
      <p style="font-size:.98rem;color:#4A3A34;line-height:1.82;">${fill(s.body, city)}</p>
    </div>`).join("");

  // Is this a photographer/newborn category? Give TWS stronger placement
  const isTWSCategory = cat.slug === "best-maternity-photographer" || cat.slug === "best-newborn-photographer";

  const twsBlock = isTWSCategory ? `
    <div style="background:#2B1F1A;border-radius:12px;padding:36px 32px;margin:44px 0;color:#FAF7F2;">
      <p style="font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#C4856A;font-weight:500;margin-bottom:10px;">Featured Studio</p>
      <h2 style="font-size:1.6rem;font-family:'Cormorant Garamond',serif;font-weight:300;margin-bottom:14px;line-height:1.25;">Two Wild Souls Photography</h2>
      <p style="font-size:.88rem;color:rgba(250,247,242,.75);line-height:1.7;margin-bottom:22px;">Serving ${city.city} and all of ${REGION_LABELS[city.region] ?? city.state}, Jasmine creates genuine, emotional maternity and newborn portraits with a signature style built around beautiful light and real connection. Every session includes complimentary hair &amp; makeup.</p>
      <a href="${QUIZ_URL}" style="display:inline-block;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:#FAF7F2;color:#2B1F1A;padding:12px 22px;border-radius:2px;">Find your perfect session →</a>
    </div>` : `
    <div style="background:#F2EDE5;border-radius:12px;padding:36px 32px;margin:44px 0;">
      <p style="font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#C4856A;font-weight:500;margin-bottom:10px;">Two Wild Souls Photography</p>
      <h2 style="font-size:1.4rem;font-family:'Cormorant Garamond',serif;font-weight:400;margin-bottom:12px;color:#2B1F1A;">Documenting your pregnancy near ${city.city}?</h2>
      <p style="font-size:.88rem;color:#4A3A34;line-height:1.7;margin-bottom:22px;">${ctaContext} Jasmine at Two Wild Souls serves families throughout ${REGION_LABELS[city.region] ?? city.state} with maternity and newborn sessions that include complimentary hair &amp; makeup.</p>
      <a href="${QUIZ_URL}" style="display:inline-block;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:#2B1F1A;color:#FAF7F2;padding:12px 22px;border-radius:2px;">See our maternity packages →</a>
    </div>`;

  const relatedCats = `
    <div style="margin-top:48px;padding-top:32px;border-top:1px solid #E6DDD4;">
      <p style="font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:#B0A49C;margin-bottom:18px;">More guides for ${city.city}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        <a href="${GUIDE_URL}/best-maternity-photographer/${city.slug}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;transition:border-color .15s;">Maternity photographers</a>
        <a href="${GUIDE_URL}/best-newborn-photographer/${city.slug}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;">Newborn photographers</a>
        <a href="${GUIDE_URL}/best-ob-gyn/${city.slug}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;">OB-GYNs</a>
        <a href="${GUIDE_URL}/best-midwife/${city.slug}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;">Midwives</a>
        <a href="${GUIDE_URL}/best-pediatrician/${city.slug}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;">Pediatricians</a>
        <a href="${HUB_URL}/" style="font-size:.78rem;padding:8px 14px;border:1px solid #E6DDD4;border-radius:4px;color:#4A3A34;">Maternity guide</a>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} | ${SITE_NAME}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${GUIDE_URL}/${cat.slug}/${city.slug}/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${GUIDE_URL}/${cat.slug}/${city.slug}/">
<style>
${BRAND_CSS}
.breadcrumb{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#B0A49C;padding:26px 0 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.breadcrumb a{color:#B0A49C;}
.breadcrumb a:hover{color:#2B1F1A;}
.sep{opacity:.35;}
.entry-header{padding:28px 0 36px;border-bottom:1px solid #E6DDD4;margin-bottom:40px;}
.region-tag{display:inline-block;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;padding:4px 11px;border-radius:2px;background:#F5EAE4;color:#C4856A;margin-bottom:16px;}
h1{font-size:clamp(1.7rem,5vw,2.5rem);letter-spacing:-.01em;color:#2B1F1A;}
.intro{font-size:1.02rem;color:#4A3A34;line-height:1.82;margin-bottom:40px;}
.disclaimer{font-size:.73rem;color:#B0A49C;border-left:2px solid #E6DDD4;padding:10px 16px;margin:32px 0;font-style:italic;line-height:1.6;}
@media(max-width:600px){.entry-header h1{font-size:1.6rem;}}
</style>
</head>
<body>
${HEADER_HTML}
<main class="container">
  <nav class="breadcrumb">
    <a href="${SITE_URL}">Home</a><span class="sep">›</span>
    <a href="${GUIDE_URL}/local-guide/">Local Guide</a><span class="sep">›</span>
    <a href="${GUIDE_URL}/${cat.slug}/">${cat.h1.replace(" in {city}", "").replace("{city}", "")}</a><span class="sep">›</span>
    <span>${city.city}, ${city.state}</span>
  </nav>
  <header class="entry-header">
    <span class="region-tag">${REGION_LABELS[city.region] ?? city.region}</span>
    <h1>${h1}</h1>
  </header>
  <p class="intro">${intro}</p>
  ${sectionsHTML}
  ${twsBlock}
  <div class="disclaimer">This guide is for informational purposes only. Provider listings and recommendations reflect general guidance — always verify credentials, insurance acceptance, and availability directly with any provider before booking.</div>
  ${relatedCats}
</main>
${FOOTER_HTML}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/"/g,'\\"')}","description":"${description.replace(/"/g,'\\"')}","url":"${GUIDE_URL}/${cat.slug}/${city.slug}/","publisher":{"@type":"LocalBusiness","name":"${SITE_NAME}","url":"${SITE_URL}","address":{"@type":"PostalAddress","streetAddress":"1002 N Main St Suite #1","addressLocality":"Rochester","addressRegion":"MI","postalCode":"48307"}}}
</script>
</body>
</html>`;
}

// ─── LOCAL GUIDE HUB ─────────────────────────────────────────────────────────

function buildLocalHub(cities, categories) {
  const regionGroups = {};
  cities.forEach(c => {
    if (!regionGroups[c.region]) regionGroups[c.region] = [];
    regionGroups[c.region].push(c);
  });

  const regionHTML = Object.entries(regionGroups).map(([region, rcities]) => `
    <div style="margin-bottom:48px;">
      <h2 style="font-size:1.3rem;color:#2B1F1A;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid #E6DDD4;">${REGION_LABELS[region] ?? region}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
        ${rcities.map(city => `
          <div style="background:#fff;border:1px solid #E6DDD4;border-radius:8px;padding:16px 18px;">
            <p style="font-family:'Cormorant Garamond',serif;font-size:1rem;margin-bottom:10px;color:#2B1F1A;">${city.city}</p>
            <div style="display:flex;flex-direction:column;gap:5px;">
              ${categories.map(cat => `
                <a href="${GUIDE_URL}/${cat.slug}/${city.slug}/" style="font-size:.72rem;color:#7A6A63;display:flex;align-items:center;gap:5px;transition:color .15s;" onmouseover="this.style.color='#2B1F1A'" onmouseout="this.style.color='#7A6A63'">
                  <span style="color:#C4856A;font-size:.6rem;">→</span> ${cat.slug.replace("best-","").replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
                </a>`).join("")}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Local Maternity Guide: Southeast Michigan, Grand Rapids & Toledo | ${SITE_NAME}</title>
<meta name="description" content="Find the best OB-GYNs, midwives, birth centers, maternity photographers, newborn photographers, pediatricians, and lactation consultants across Southeast Michigan, Grand Rapids, and Toledo.">
<link rel="canonical" href="${GUIDE_URL}/local-guide/">
<style>
${BRAND_CSS}
.hero{text-align:center;padding:56px 0 44px;border-bottom:1px solid #E6DDD4;margin-bottom:48px;}
.hero-ey{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#C4856A;font-weight:500;margin-bottom:14px;}
.hero h1{font-size:clamp(1.8rem,5vw,3rem);font-weight:300;line-height:1.15;letter-spacing:-.01em;color:#2B1F1A;margin-bottom:16px;}
.hero h1 em{font-style:italic;color:#C4856A;}
.hero p{font-size:.95rem;color:#7A6A63;max-width:500px;margin:0 auto;line-height:1.75;}
</style>
</head>
<body>
${HEADER_HTML}
<main class="container">
  <div class="hero">
    <p class="hero-ey">Two Wild Souls Photography</p>
    <h1>Local Maternity &amp;<br><em>Family Resource Guide</em></h1>
    <p>Find the best providers and photographers across Southeast Michigan, Grand Rapids, and Toledo — organized by city.</p>
  </div>
  ${regionHTML}
</main>
${FOOTER_HTML}
</body>
</html>`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const cities     = JSON.parse(fs.readFileSync(CITIES_FILE, "utf8"));
const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));

let count = 0;

// City × category pages
cities.forEach(city => {
  categories.forEach(cat => {
    const file = path.join(OUTPUT_ROOT, cat.slug, city.slug, "index.html");
    write(file, buildCityPage(city, cat));
    count++;
  });
});
console.log(`✓  ${count} city pages → output/[category]/[city]/index.html`);

// Local guide hub
write(path.join(OUTPUT_ROOT, "local-guide", "index.html"), buildLocalHub(cities, categories));
console.log(`✓  Local guide hub → output/local-guide/index.html`);

console.log(`\nTotal new files: ${count + 1}`);
console.log(`Combined with maternity guide: ${count + 1 + 62} files total`);

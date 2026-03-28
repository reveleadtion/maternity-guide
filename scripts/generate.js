#!/usr/bin/env node

/**
 * TWO WILD SOULS — Maternity Content Database Generator
 *
 * Outputs:
 *   output/index.html            → hub (deploy root of guide.twowildsoulsphotography.com)
 *   output/[slug]/index.html     → individual entry pages
 *   output/hub-embed.html        → paste into Showit code block at /maternity-guide
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE   = path.join(__dirname, "../data/entries.json");
const OUTPUT_ROOT = path.join(__dirname, "../output");

const SITE_NAME = "Two Wild Souls Photography";
const SITE_URL  = "https://www.twowildsoulsphotography.com";
const GUIDE_URL = "https://maternityguide.twowildsoulsphotography.com";
const QUIZ_URL  = "https://moments.twowildsoulsphotography.com";
const HUB_URL   = `${SITE_URL}/maternity-guide`;

const CLUSTER_META = {
  symptoms:  { label: "Symptoms & Body"     },
  nutrition: { label: "Nutrition & Wellness" },
  prep:      { label: "Preparing for Baby"  },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function clusterLabel(c) { return CLUSTER_META[c]?.label ?? c; }

// ─── SHARED BRAND CSS (entry pages) ─────────────────────────────────────────

const BRAND_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#2B1F1A;--ink2:#4A3A34;--ink3:#7A6A63;--ink4:#B0A49C;
  --cream:#FAF7F2;--parch:#F2EDE5;--border:#E6DDD4;
  --rose:#C4856A;--rose-l:#F5EAE4;
  --sage:#7A9E8A;--sage-l:#EBF2ED;
  --gold:#B8945F;
}
body{font-family:'Jost',sans-serif;font-weight:300;background:var(--cream);color:var(--ink);line-height:1.7;}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;line-height:1.2;}
a{color:inherit;text-decoration:none;}
.container{max-width:860px;margin:0 auto;padding:0 28px;}
`;

// ─── ENTRY PAGE ──────────────────────────────────────────────────────────────

function buildEntryPage(entry) {
  const weekCTA = entry.week_tag && entry.week_tag !== "all trimesters"
    ? `Around <em>${entry.week_tag}</em>, many moms start thinking about documenting this season of pregnancy.`
    : `Maternity photography is one of the most meaningful ways to honour this season of your life.`;

  const sentences = entry.summary.match(/[^.!?]+[.!?]+/g) || [entry.summary];
  const paras = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paras.push(sentences.slice(i, i + 3).join(" ").trim());
  }
  const bodyHTML = paras.map(p => `<p>${p}</p>`).join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${cap(entry.title)} | Two Wild Souls Maternity Guide</title>
<meta name="description" content="${entry.summary.slice(0,155).replace(/"/g,"&quot;")}">
<link rel="canonical" href="${GUIDE_URL}/${entry.slug}/">
<meta property="og:title" content="${cap(entry.title)}">
<meta property="og:url" content="${GUIDE_URL}/${entry.slug}/">
<style>
${BRAND_CSS}
.site-header{padding:18px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:14px;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:1.1rem;letter-spacing:.04em;}
.brand-sub{font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3);}
.btn-book{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:var(--ink);color:var(--cream);padding:10px 20px;border-radius:2px;white-space:nowrap;transition:opacity .15s;}
.btn-book:hover{opacity:.82;}
.breadcrumb{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink4);padding:26px 0 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.breadcrumb a{color:var(--ink4);}
.breadcrumb a:hover{color:var(--ink);}
.sep{opacity:.35;}
.entry-header{padding:30px 0 36px;border-bottom:1px solid var(--border);margin-bottom:40px;}
.entry-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;}
.pill{font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;padding:4px 11px;border-radius:2px;}
.pill.symptoms{background:var(--rose-l);color:var(--rose);}
.pill.nutrition{background:var(--sage-l);color:var(--sage);}
.pill.prep{background:var(--parch);color:var(--gold);}
.week-tag{font-size:.7rem;color:var(--ink4);font-style:italic;}
.entry-header h1{font-size:clamp(1.7rem,5vw,2.5rem);letter-spacing:-.01em;}
.entry-body{font-size:1.01rem;color:var(--ink2);line-height:1.85;margin-bottom:44px;}
.entry-body p{margin-bottom:1.5em;}
.disclaimer{font-size:.73rem;color:var(--ink4);border-left:2px solid var(--border);padding:10px 16px;margin:32px 0;font-style:italic;line-height:1.6;}
.cta-block{background:var(--parch);border-radius:12px;padding:40px 36px;margin:44px 0;display:flex;align-items:center;justify-content:space-between;gap:28px;flex-wrap:wrap;}
.cta-ey{font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--rose);font-weight:500;margin-bottom:10px;}
.cta-block h2{font-size:1.55rem;margin-bottom:12px;max-width:300px;}
.cta-block p{font-size:.86rem;color:var(--ink2);line-height:1.65;max-width:340px;margin-bottom:22px;}
.btn-dark{display:inline-block;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:var(--ink);color:var(--cream);padding:12px 22px;border-radius:2px;transition:opacity .15s;}
.btn-dark:hover{opacity:.82;}
.back-link{display:inline-flex;align-items:center;gap:7px;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink4);padding:28px 0 52px;transition:color .15s;}
.back-link:hover{color:var(--ink);}
.site-footer{border-top:1px solid var(--border);padding:28px;text-align:center;font-size:.7rem;letter-spacing:.07em;color:var(--ink4);}
.site-footer a{color:var(--ink4);border-bottom:1px solid var(--border);padding-bottom:1px;}
@media(max-width:600px){.cta-block{padding:26px 20px;}.entry-header h1{font-size:1.6rem;}}
</style>
</head>
<body>
<header class="site-header">
  <a href="${SITE_URL}">
    <div class="brand-name">Two Wild Souls Photography</div>
    <div class="brand-sub">Rochester, Michigan</div>
  </a>
  <a href="${QUIZ_URL}" class="btn-book">Reserve Your session</a>
</header>
<main class="container">
  <nav class="breadcrumb">
    <a href="${SITE_URL}">Home</a><span class="sep">›</span>
    <a href="${HUB_URL}">Maternity Guide</a><span class="sep">›</span>
    <span>${clusterLabel(entry.cluster)}</span>
  </nav>
  <header class="entry-header">
    <div class="entry-meta">
      <span class="pill ${entry.cluster}">${clusterLabel(entry.cluster)}</span>
      ${entry.week_range ? `<span class="week-tag">${entry.week_range}</span>` : ""}
    </div>
    <h1>${cap(entry.title)}</h1>
  </header>
  <div class="entry-body">
    ${bodyHTML}
  </div>
  <div class="disclaimer">This content is for general informational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider regarding your individual pregnancy.</div>
  <div class="cta-block">
    <div>
      <p class="cta-ey">Two Wild Souls Photography</p>
      <h2>Documenting this season?</h2>
      <p>${weekCTA} Jasmine creates genuine, emotional maternity portraits for families across Metro Detroit — with complimentary hair &amp; makeup included.</p>
      <a href="${QUIZ_URL}" class="btn-dark">Find your perfect session →</a>
    </div>
  </div>
  <a href="${HUB_URL}" class="back-link">← Back to the Maternity Guide</a>
</main>
<footer class="site-footer">
  © ${new Date().getFullYear()} ${SITE_NAME} &nbsp;·&nbsp; 1002 N Main St, Rochester MI 48307 &nbsp;·&nbsp;
  <a href="${SITE_URL}">twowildsoulsphotography.com</a>
</footer>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${cap(entry.title).replace(/"/g,'\\"')}","description":"${entry.summary.slice(0,200).replace(/"/g,'\\"')}","url":"${GUIDE_URL}/${entry.slug}/","publisher":{"@type":"LocalBusiness","name":"${SITE_NAME}","url":"${SITE_URL}"}}
</script>
</body>
</html>`;
}

// ─── HUB PAGE ────────────────────────────────────────────────────────────────

function buildHub(entries, mode) {
  const counts = {};
  entries.forEach(e => counts[e.cluster] = (counts[e.cluster] ?? 0) + 1);

  const cards = entries.map(e => `
    <a href="${GUIDE_URL}/${e.slug}/" class="tws-card" data-cluster="${e.cluster}">
      <span class="tws-pill ${e.cluster}">${clusterLabel(e.cluster)}</span>
      <h3>${cap(e.title)}</h3>
      ${e.week_range ? `<span class="tws-week">${e.week_range}</span>` : ""}
      <p>${e.summary.slice(0,118).trim()}…</p>
      <span class="tws-arrow">→</span>
    </a>`).join("");

  const inner = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">

<style>
#tws-hub{font-family:'Jost',sans-serif;font-weight:300;color:#2B1F1A;background:#ffffff;width:100%;padding:0;}
#tws-hub *{box-sizing:border-box;}

#tws-hub .filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;}
#tws-hub .search-wrap{position:relative;flex:1;min-width:210px;}
#tws-hub .search-wrap input{width:100%;padding:11px 16px 11px 38px;border:1px solid #E6DDD4;border-radius:4px;font-family:'Jost',sans-serif;font-size:.84rem;font-weight:300;background:#ffffff;color:#2B1F1A;outline:none;transition:border-color .15s;}
#tws-hub .search-wrap input:focus{border-color:#C4856A;}
#tws-hub .search-wrap input::placeholder{color:#B0A49C;}
#tws-hub .s-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:14px;height:14px;opacity:.3;pointer-events:none;}

#tws-hub .fbtn{font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:500;padding:10px 15px;border:1px solid #E6DDD4;border-radius:2px;background:#ffffff;color:#7A6A63;cursor:pointer;transition:all .15s;white-space:nowrap;}
#tws-hub .fbtn:hover{border-color:#2B1F1A;color:#2B1F1A;}
#tws-hub .fbtn.active{background:#2B1F1A;color:#ffffff;border-color:#2B1F1A;}
#tws-hub .fbtn.active.symptoms{background:#C4856A;border-color:#C4856A;}
#tws-hub .fbtn.active.nutrition{background:#7A9E8A;border-color:#7A9E8A;}
#tws-hub .fbtn.active.prep{background:#B8945F;border-color:#B8945F;}

#tws-hub .meta-row{font-size:.7rem;letter-spacing:.06em;color:#B0A49C;margin-bottom:24px;margin-top:10px;}

#tws-hub .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:15px;margin-bottom:32px;}

#tws-hub .tws-card{display:flex;flex-direction:column;gap:7px;background:#ffffff;border:1px solid #E6DDD4;border-radius:8px;padding:21px 19px;transition:box-shadow .18s,border-color .18s,transform .18s;color:#2B1F1A;text-decoration:none;}
#tws-hub .tws-card:hover{box-shadow:0 6px 22px rgba(43,31,26,.08);border-color:#D4C8BE;transform:translateY(-2px);}
#tws-hub .tws-pill{display:inline-block;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;padding:4px 10px;border-radius:2px;align-self:flex-start;}
#tws-hub .tws-pill.symptoms{background:#F5EAE4;color:#C4856A;}
#tws-hub .tws-pill.nutrition{background:#EBF2ED;color:#7A9E8A;}
#tws-hub .tws-pill.prep{background:#F2EDE5;color:#B8945F;}
#tws-hub .tws-card h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.02rem;font-weight:400;line-height:1.35;color:#2B1F1A;}
#tws-hub .tws-week{font-size:.66rem;color:#B0A49C;font-style:italic;}
#tws-hub .tws-card p{font-size:.78rem;color:#7A6A63;line-height:1.58;flex:1;}
#tws-hub .tws-arrow{font-size:.78rem;color:#C4856A;transition:transform .15s;}
#tws-hub .tws-card:hover .tws-arrow{transform:translateX(4px);}
#tws-hub .hidden{display:none!important;}
#tws-hub .no-res{display:none;text-align:center;padding:64px 0;color:#B0A49C;font-size:.9rem;font-style:italic;}
</style>

<div id="tws-hub">
  <div class="filter-row">
    <div class="search-wrap">
      <svg class="s-icon" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#2B1F1A" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="#2B1F1A" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input type="text" id="tws-q" placeholder="Search topics…" aria-label="Search maternity topics">
    </div>
    <button class="fbtn active" data-f="all">All (${entries.length})</button>
    <button class="fbtn symptoms" data-f="symptoms">Symptoms (${counts.symptoms ?? 0})</button>
    <button class="fbtn nutrition" data-f="nutrition">Nutrition (${counts.nutrition ?? 0})</button>
    <button class="fbtn prep" data-f="prep">Prep (${counts.prep ?? 0})</button>
  </div>

  <p class="meta-row" id="tws-ct">${entries.length} topics</p>

  <div class="grid" id="tws-grid">${cards}</div>
  <p class="no-res" id="tws-nr">No topics match — try different keywords.</p>
</div>

<script>
(function(){
  var q='',f='all';
  var cards=Array.from(document.querySelectorAll('#tws-grid .tws-card'));
  var btns=Array.from(document.querySelectorAll('#tws-hub .fbtn'));
  var ct=document.getElementById('tws-ct');
  var nr=document.getElementById('tws-nr');
  function run(){
    var v=0;
    cards.forEach(function(c){
      var ok=(f==='all'||c.dataset.cluster===f)&&(q===''||c.textContent.toLowerCase().includes(q.toLowerCase()));
      c.classList.toggle('hidden',!ok);
      if(ok)v++;
    });
    ct.textContent=v+' topic'+(v!==1?'s':'');
    nr.style.display=v===0?'block':'none';
  }
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      btns.forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');f=b.dataset.f;run();
    });
  });
  var inp=document.getElementById('tws-q');
  if(inp)inp.addEventListener('input',function(e){q=e.target.value;run();});
})();
</script>`;

  if (mode === "embed") return inner;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Complete Maternity Guide | ${SITE_NAME}</title>
<meta name="description" content="A searchable resource for every stage of pregnancy from Two Wild Souls Photography in Rochester, MI.">
<link rel="canonical" href="${GUIDE_URL}/">
<style>
${BRAND_CSS}
body{min-height:100vh;}
.site-header{padding:18px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #FFFFFF;flex-wrap:wrap;gap:14px;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:1.1rem;letter-spacing:.04em;}
.brand-sub{font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:#7A6A63;}
.btn-h{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;background:#2B1F1A;color:#FAF7F2;padding:10px 20px;border-radius:2px;white-space:nowrap;transition:opacity .15s;}
.btn-h:hover{opacity:.82;}
.site-footer{border-top:1px solid #E6DDD4;padding:28px;text-align:center;font-size:.7rem;letter-spacing:.07em;color:#B0A49C;}
.site-footer a{color:#B0A49C;border-bottom:1px solid #E6DDD4;padding-bottom:1px;}
</style>
</head>
<body>
<header class="site-header">
  <a href="${SITE_URL}">
    <div class="brand-name">Two Wild Souls Photography</div>
    <div class="brand-sub">Rochester, Michigan</div>
  </a>
  <a href="${QUIZ_URL}" class="btn-h">Reserve Your session</a>
</header>

${inner}

<footer class="site-footer">
  © ${new Date().getFullYear()} ${SITE_NAME} &nbsp;·&nbsp; 1002 N Main St, Rochester MI 48307 &nbsp;·&nbsp;
  <a href="${SITE_URL}">twowildsoulsphotography.com</a>
</footer>
</body>
</html>`;
}

// ─── VERCEL CONFIG ───────────────────────────────────────────────────────────

function buildVercelConfig() {
  return JSON.stringify({
    version: 2,
    buildCommand: "node scripts/generate.js",
    outputDirectory: "output",
    cleanUrls: true,
    trailingSlash: false
  }, null, 2);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const entries = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
ensureDir(OUTPUT_ROOT);

write(path.join(OUTPUT_ROOT, "index.html"), buildHub(entries, "subdomain"));
console.log("✓  Hub (subdomain) → output/index.html");

write(path.join(OUTPUT_ROOT, "hub-embed.html"), buildHub(entries, "embed"));
console.log("✓  Showit embed   → output/hub-embed.html");

let count = 0;
entries.forEach(e => {
  write(path.join(OUTPUT_ROOT, e.slug, "index.html"), buildEntryPage(e));
  count++;
});
console.log(`✓  ${count} entry pages  → output/[slug]/index.html`);

// Always rewrite vercel.json from source
write(path.join(__dirname, "../vercel.json"), buildVercelConfig());
console.log("✓  vercel.json updated");

console.log(`\nTotal: ${count + 2} HTML files written.`);
console.log("\nDeploy steps:");
console.log("  1. Push this repo to GitHub");
console.log("  2. Import into Vercel → output directory: output → build command: node scripts/generate.js");
console.log("  3. Add custom domain: guide.twowildsoulsphotography.com");
console.log("  4. In Showit: new page at /maternity-guide → Code Embed → paste hub-embed.html contents");

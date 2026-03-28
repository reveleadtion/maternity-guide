#!/usr/bin/env node

/**
 * TWO WILD SOULS — Maternity Content Database Generator
 * 
 * Reads data/entries.json and outputs:
 *   output/maternity-guide/index.html      — hub page (browsable, filterable)
 *   output/maternity-guide/[slug]/index.html — one page per entry
 * 
 * Usage:
 *   node scripts/generate.js
 * 
 * Deploy the output/ directory to Vercel (or any static host).
 * Map your domain's /maternity-guide path to this output via vercel.json rewrites.
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE   = path.join(__dirname, "../data/entries.json");
const OUTPUT_ROOT = path.join(__dirname, "../output/maternity-guide");

const SITE_NAME  = "Two Wild Souls Photography";
const SITE_URL   = "https://www.twowildsoulsphotography.com";
const QUIZ_URL   = "https://moments.twowildsoulsphotography.com";
const BASE_PATH  = "/maternity-guide";

const CLUSTER_META = {
  symptoms:  { label: "Symptoms & Body Changes", color: "#7C5CBF" },
  nutrition: { label: "Nutrition & Wellness",     color: "#2E8B6E" },
  prep:      { label: "Preparing for Baby",       color: "#C0633A" },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function clusterLabel(cluster) {
  return CLUSTER_META[cluster]?.label ?? cluster;
}

function clusterColor(cluster) {
  return CLUSTER_META[cluster]?.color ?? "#888";
}

// capitalize first letter only (for display)
function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── shared CSS ─────────────────────────────────────────────────────────────

const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:   #FAF8F3;
    --ink:     #1A1714;
    --ink2:    #4A4540;
    --ink3:    #8A837A;
    --border:  #E4DFDA;
    --sym:     #C0633A;
    --sym-low: #F5EDE8;
    --nut:     #2E8B6E;
    --nut-low: #E8F4F0;
    --pre:     #7C5CBF;
    --pre-low: #F0ECF9;
    --radius:  10px;
    --max:     760px;
    font-size: 16px;
  }

  body {
    font-family: "Georgia", "Times New Roman", serif;
    background: var(--cream);
    color: var(--ink);
    line-height: 1.7;
  }

  a { color: inherit; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .site-header {
    border-bottom: 1px solid var(--border);
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .site-header .brand {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink3);
    font-family: "Helvetica Neue", Arial, sans-serif;
  }

  .site-header .brand strong {
    color: var(--ink);
    font-weight: 600;
  }

  .site-header .btn-quiz {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--ink);
    color: var(--cream);
    padding: 9px 18px;
    border-radius: 4px;
    white-space: nowrap;
    transition: opacity 0.15s;
  }

  .site-header .btn-quiz:hover { opacity: 0.82; text-decoration: none; }

  .container { max-width: var(--max); margin: 0 auto; padding: 0 24px; }

  .cluster-badge {
    display: inline-block;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 3px;
  }

  .cluster-badge.symptoms  { background: var(--sym-low);  color: var(--sym); }
  .cluster-badge.nutrition { background: var(--nut-low);  color: var(--nut); }
  .cluster-badge.prep      { background: var(--pre-low);  color: var(--pre); }
`;

// ─── entry page template ─────────────────────────────────────────────────────

function buildEntryPage(entry) {
  const clusterColor = CLUSTER_META[entry.cluster]?.color ?? "#888";
  const internalLinkBlock = entry.internal_link
    ? `<div class="related">
        <span>Related reading:</span>
        <a href="${SITE_URL}/blog/${entry.internal_link}">Read our full post →</a>
       </div>`
    : "";

  // Determine week context for the CTA block
  const weekCTA = entry.week_tag && entry.week_tag !== "all trimesters"
    ? `Around <strong>${entry.week_tag}</strong>, many moms start thinking about documenting this season.`
    : `Maternity photography is one of the most meaningful ways to honor this season of your life.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleCase(entry.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${entry.summary.slice(0, 155).replace(/"/g, '&quot;')}...">
  <link rel="canonical" href="${SITE_URL}${BASE_PATH}/${entry.slug}/">
  <!-- Open Graph -->
  <meta property="og:title" content="${titleCase(entry.title)}">
  <meta property="og:description" content="${entry.summary.slice(0, 200).replace(/"/g, '&quot;')}">
  <meta property="og:url" content="${SITE_URL}${BASE_PATH}/${entry.slug}/">
  <meta property="og:site_name" content="${SITE_NAME}">
  <style>
    ${SHARED_CSS}

    .breadcrumb {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.78rem;
      color: var(--ink3);
      padding: 22px 0 0;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .breadcrumb a { color: var(--ink3); }
    .breadcrumb a:hover { color: var(--ink); text-decoration: underline; }
    .breadcrumb .sep { opacity: 0.4; }

    .entry-header {
      padding: 28px 0 32px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 40px;
    }

    .entry-header .meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .week-tag {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.75rem;
      color: var(--ink3);
      letter-spacing: 0.04em;
    }

    h1 {
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: normal;
      line-height: 1.3;
      color: var(--ink);
      letter-spacing: -0.01em;
    }

    .entry-body {
      font-size: 1.05rem;
      color: var(--ink2);
      margin-bottom: 48px;
      line-height: 1.8;
    }

    .entry-body p {
      margin-bottom: 1.4em;
    }

    .disclaimer {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.78rem;
      color: var(--ink3);
      border-left: 2px solid var(--border);
      padding: 10px 14px;
      margin: 32px 0;
      line-height: 1.6;
    }

    .related {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.85rem;
      background: var(--border);
      padding: 14px 18px;
      border-radius: var(--radius);
      margin: 32px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .related span { color: var(--ink3); }
    .related a { color: var(--ink); font-weight: 600; }

    .cta-block {
      border-top: 1px solid var(--border);
      padding: 36px 0 0;
      margin: 48px 0;
      display: flex;
      gap: 28px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .cta-block .cta-text h2 {
      font-size: 1.2rem;
      font-weight: normal;
      margin-bottom: 10px;
      color: var(--ink);
      line-height: 1.4;
    }

    .cta-block .cta-text p {
      font-size: 0.9rem;
      color: var(--ink2);
      font-family: "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      margin-bottom: 18px;
    }

    .btn-primary {
      display: inline-block;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.82rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      background: var(--ink);
      color: var(--cream);
      padding: 12px 22px;
      border-radius: 4px;
      transition: opacity 0.15s;
    }

    .btn-primary:hover { opacity: 0.8; text-decoration: none; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.8rem;
      color: var(--ink3);
      padding: 32px 0 48px;
      letter-spacing: 0.04em;
    }

    .back-link:hover { color: var(--ink); text-decoration: none; }

    .site-footer {
      border-top: 1px solid var(--border);
      padding: 28px 24px;
      text-align: center;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.78rem;
      color: var(--ink3);
    }

    /* JSON-LD structured data styles are in the script tag below */
  </style>
</head>
<body>

  <header class="site-header">
    <div class="brand"><strong>${SITE_NAME}</strong> &nbsp;·&nbsp; Maternity Guide</div>
    <a href="${QUIZ_URL}" class="btn-quiz">See our maternity packages →</a>
  </header>

  <main class="container">

    <nav class="breadcrumb">
      <a href="${SITE_URL}">Home</a>
      <span class="sep">›</span>
      <a href="${BASE_PATH}/">Maternity Guide</a>
      <span class="sep">›</span>
      <span>${clusterLabel(entry.cluster)}</span>
    </nav>

    <header class="entry-header">
      <div class="meta">
        <span class="cluster-badge ${entry.cluster}">${clusterLabel(entry.cluster)}</span>
        ${entry.week_range ? `<span class="week-tag">${entry.week_range}</span>` : ""}
      </div>
      <h1>${titleCase(entry.title)}</h1>
    </header>

    <div class="entry-body">
      ${entry.summary.split(". ").reduce((acc, sentence, i, arr) => {
        // Break the summary into readable paragraphs every ~3 sentences
        acc.push(sentence + (i < arr.length - 1 ? "." : ""));
        return acc;
      }, []).reduce((paragraphs, sentence, i) => {
        const pIdx = Math.floor(i / 3);
        if (!paragraphs[pIdx]) paragraphs[pIdx] = [];
        paragraphs[pIdx].push(sentence);
        return paragraphs;
      }, []).map(p => `<p>${p.join(" ").trim()}</p>`).join("\n      ")}
    </div>

    <div class="disclaimer">
      This information is for general educational purposes only and is not a substitute for medical advice. Always consult your healthcare provider with questions about your individual pregnancy.
    </div>

    ${internalLinkBlock}

    <div class="cta-block">
      <div class="cta-text">
        <h2>Documenting your pregnancy?</h2>
        <p>${weekCTA} Jasmine at Two Wild Souls captures genuine, emotional maternity portraits for families across Metro Detroit and Oakland County.</p>
        <a href="${QUIZ_URL}" class="btn-primary">Find your perfect session →</a>
      </div>
    </div>

    <a href="${BASE_PATH}/" class="back-link">← Back to the full Maternity Guide</a>

  </main>

  <footer class="site-footer">
    © ${new Date().getFullYear()} ${SITE_NAME} · Metro Detroit Maternity & Newborn Photography ·
    <a href="${SITE_URL}">twowildsoulsphotography.com</a>
  </footer>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${titleCase(entry.title).replace(/"/g, '\\"')}",
    "description": "${entry.summary.slice(0, 200).replace(/"/g, '\\"')}",
    "url": "${SITE_URL}${BASE_PATH}/${entry.slug}/",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}"
    },
    "mainEntityOfPage": "${SITE_URL}${BASE_PATH}/${entry.slug}/"
  }
  </script>

</body>
</html>`;
}

// ─── hub / index page ────────────────────────────────────────────────────────

function buildHubPage(entries) {
  const clusterCounts = {};
  entries.forEach(e => {
    clusterCounts[e.cluster] = (clusterCounts[e.cluster] ?? 0) + 1;
  });

  const cardHTML = entries.map(entry => `
    <a href="${BASE_PATH}/${entry.slug}/" class="card" data-cluster="${entry.cluster}" data-week="${entry.week_tag ?? ""}">
      <span class="cluster-badge ${entry.cluster}">${clusterLabel(entry.cluster)}</span>
      <h3>${titleCase(entry.title)}</h3>
      ${entry.week_range ? `<span class="week">${entry.week_range}</span>` : ""}
      <p>${entry.summary.slice(0, 130).trim()}…</p>
    </a>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Maternity Guide | ${SITE_NAME}</title>
  <meta name="description" content="A comprehensive resource for every stage of pregnancy — symptoms by week, nutrition, and preparing for baby — from Two Wild Souls Photography.">
  <link rel="canonical" href="${SITE_URL}${BASE_PATH}/">
  <meta property="og:title" content="Complete Maternity Guide">
  <meta property="og:description" content="A searchable, filterable resource covering maternity symptoms, nutrition, and baby preparation — ${entries.length} topics and growing.">
  <meta property="og:url" content="${SITE_URL}${BASE_PATH}/">
  <style>
    ${SHARED_CSS}

    /* ─── Hub-specific ─────────────────────────────── */

    .hub-hero {
      padding: 56px 0 40px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 40px;
    }

    .hub-hero .eyebrow {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink3);
      margin-bottom: 14px;
    }

    .hub-hero h1 {
      font-size: clamp(1.8rem, 5vw, 2.8rem);
      font-weight: normal;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin-bottom: 18px;
    }

    .hub-hero p {
      font-size: 1.05rem;
      color: var(--ink2);
      max-width: 540px;
      line-height: 1.7;
    }

    /* ─── Filters ───────────────────────────────────── */

    .filter-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 28px;
    }

    .filter-bar input {
      flex: 1;
      min-width: 200px;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.88rem;
      background: white;
      color: var(--ink);
      outline: none;
      transition: border-color 0.15s;
    }

    .filter-bar input:focus { border-color: var(--ink3); }
    .filter-bar input::placeholder { color: var(--ink3); }

    .filter-btn {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      padding: 9px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: white;
      color: var(--ink2);
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .filter-btn:hover,
    .filter-btn.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }

    .results-count {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.8rem;
      color: var(--ink3);
      margin-bottom: 24px;
    }

    /* ─── Cards ─────────────────────────────────────── */

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
      margin-bottom: 64px;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      transition: box-shadow 0.15s, border-color 0.15s;
    }

    .card:hover {
      box-shadow: 0 4px 18px rgba(0,0,0,0.07);
      border-color: #ccc;
      text-decoration: none;
    }

    .card h3 {
      font-size: 0.98rem;
      font-weight: normal;
      line-height: 1.4;
      color: var(--ink);
    }

    .card .week {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.72rem;
      color: var(--ink3);
      letter-spacing: 0.03em;
    }

    .card p {
      font-size: 0.82rem;
      color: var(--ink2);
      font-family: "Helvetica Neue", Arial, sans-serif;
      line-height: 1.55;
      flex: 1;
    }

    .card-hidden { display: none; }

    /* ─── No results ─────────────────────────────────── */

    .no-results {
      display: none;
      text-align: center;
      padding: 60px 0;
      color: var(--ink3);
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.9rem;
    }

    /* ─── Footer CTA ─────────────────────────────────── */

    .hub-cta {
      background: var(--ink);
      color: var(--cream);
      border-radius: 12px;
      padding: 40px 36px;
      margin-bottom: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }

    .hub-cta h2 {
      font-size: 1.3rem;
      font-weight: normal;
      margin-bottom: 8px;
    }

    .hub-cta p {
      font-size: 0.88rem;
      opacity: 0.72;
      font-family: "Helvetica Neue", Arial, sans-serif;
      max-width: 380px;
      line-height: 1.6;
    }

    .btn-light {
      display: inline-block;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.82rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      background: var(--cream);
      color: var(--ink);
      padding: 12px 22px;
      border-radius: 4px;
      white-space: nowrap;
      transition: opacity 0.15s;
    }

    .btn-light:hover { opacity: 0.88; text-decoration: none; }

    .site-footer {
      border-top: 1px solid var(--border);
      padding: 28px 24px;
      text-align: center;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.78rem;
      color: var(--ink3);
    }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="brand"><strong>${SITE_NAME}</strong> &nbsp;·&nbsp; Maternity Guide</div>
    <a href="${QUIZ_URL}" class="btn-quiz">See our maternity packages →</a>
  </header>

  <main class="container">

    <div class="hub-hero">
      <p class="eyebrow">${SITE_NAME}</p>
      <h1>The Complete<br>Maternity Guide</h1>
      <p>A searchable resource covering every stage of pregnancy — from first-trimester symptoms to preparing for your baby's arrival. ${entries.length} topics and growing.</p>
    </div>

    <div class="filter-bar">
      <input type="text" id="search" placeholder="Search topics…" aria-label="Search topics">
      <button class="filter-btn active" data-filter="all">All (${entries.length})</button>
      ${Object.entries(CLUSTER_META).map(([key, meta]) =>
        `<button class="filter-btn" data-filter="${key}">${meta.label} (${clusterCounts[key] ?? 0})</button>`
      ).join("\n      ")}
    </div>

    <p class="results-count" id="results-count">${entries.length} topics</p>

    <div class="cards-grid" id="cards-grid">
      ${cardHTML}
    </div>

    <p class="no-results" id="no-results">No topics match your search. Try different keywords.</p>

    <div class="hub-cta">
      <div>
        <h2>Ready to document this season?</h2>
        <p>Jasmine specializes in genuine, emotional maternity portraits for families across Metro Detroit and Oakland County.</p>
      </div>
      <a href="${QUIZ_URL}" class="btn-light">Find your perfect session →</a>
    </div>

  </main>

  <footer class="site-footer">
    © ${new Date().getFullYear()} ${SITE_NAME} · Metro Detroit Maternity & Newborn Photography ·
    <a href="${SITE_URL}">twowildsoulsphotography.com</a>
  </footer>

  <script>
    const searchEl  = document.getElementById("search");
    const countEl   = document.getElementById("results-count");
    const noResults = document.getElementById("no-results");
    const cards     = Array.from(document.querySelectorAll(".card"));
    const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));

    let activeFilter = "all";
    let searchQuery  = "";

    function update() {
      let visible = 0;
      cards.forEach(card => {
        const clusterMatch = activeFilter === "all" || card.dataset.cluster === activeFilter;
        const textMatch = searchQuery === "" ||
          card.textContent.toLowerCase().includes(searchQuery.toLowerCase());
        const show = clusterMatch && textMatch;
        card.classList.toggle("card-hidden", !show);
        if (show) visible++;
      });
      countEl.textContent = visible + " topic" + (visible !== 1 ? "s" : "");
      noResults.style.display = visible === 0 ? "block" : "none";
    }

    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        update();
      });
    });

    searchEl.addEventListener("input", e => {
      searchQuery = e.target.value;
      update();
    });
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Complete Maternity Guide",
    "description": "A comprehensive resource for every stage of pregnancy from ${SITE_NAME}.",
    "url": "${SITE_URL}${BASE_PATH}/",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}"
    }
  }
  </script>

</body>
</html>`;
}

// ─── main ────────────────────────────────────────────────────────────────────

const entries = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

ensureDir(OUTPUT_ROOT);

// Hub page
write(path.join(OUTPUT_ROOT, "index.html"), buildHubPage(entries));
console.log(`✓  Hub page → output/maternity-guide/index.html`);

// Entry pages
let count = 0;
entries.forEach(entry => {
  const dir  = path.join(OUTPUT_ROOT, entry.slug);
  const file = path.join(dir, "index.html");
  write(file, buildEntryPage(entry));
  count++;
});

console.log(`✓  ${count} entry pages → output/maternity-guide/[slug]/index.html`);
console.log(`\nDone. ${count + 1} total files written.`);
console.log(`\nTo add entries: edit data/entries.json and re-run this script.`);

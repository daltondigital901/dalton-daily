// Print edition: an 11 x 17 in tabloid laid out like a real newspaper, rendered to PDF by headless Chrome.
// Front page, one or more pages per desk in five justified columns, a markets table, Reflections and the funnies.
import { DESKS, SECTIONS } from "./sections.js";

const esc = (s = "") =>
  String(s)
    .replace(/<\/?cite\b[^>]*>/gi, "")
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));
const paras = (t = "", dateline = "") =>
  String(t)
    .split(/\n{2,}|\n/)
    .filter(Boolean)
    .map((p, i) => `<p>${i === 0 && dateline ? `<b class="dl">${esc(dateline)} &mdash;</b> ` : ""}${esc(p)}</p>`)
    .join("");

function photo(s, cls = "") {
  if (!s.image?.src) return "";
  const fb = s.image.fallback ? ` data-fallback="${esc(s.image.fallback)}"` : "";
  return `<figure class="ph ${cls}"><img src="${esc(s.image.src)}"${fb} alt="" referrerpolicy="no-referrer"><figcaption>${esc(s.image.credit || "")}</figcaption></figure>`;
}
const srcLine = (s) => (s.sources?.length ? `<p class="src">Sources: ${s.sources.slice(0, 3).map((x) => esc(x.name)).join("; ")}</p>` : "");

function story(s, { lead = false } = {}) {
  return `<article class="st${lead ? " lead" : ""}">
    <h3>${esc(s.headline)}</h3>${s.dek ? `<p class="dek">${esc(s.dek)}</p>` : ""}
    ${photo(s)}
    <div class="body">${paras(s.body, s.dateline)}</div>
    ${s.why ? `<p class="why"><b>Why it matters:</b> ${esc(s.why)}</p>` : ""}${srcLine(s)}
  </article>`;
}

// A desk's top story runs across the page: photo on the left, text in two columns on the right.
function feature(s) {
  return `<article class="feature">
    ${s.image?.src ? `<div class="fphoto">${photo(s)}</div>` : ""}
    <div class="ftext"><h2>${esc(s.headline)}</h2>${s.dek ? `<p class="dek big">${esc(s.dek)}</p>` : ""}
      <div class="body two">${paras(s.body, s.dateline)}${s.why ? `<p class="why"><b>Why it matters:</b> ${esc(s.why)}</p>` : ""}${srcLine(s)}</div></div>
  </article>`;
}

function folio(ed, label, n) {
  return `<header class="folio"><span>Dalton Daily</span><span>${esc(label)}</span><span>${esc(ed.longDate)}</span></header>`;
}

function weatherBox(ed) {
  const w = ed.weather;
  return w ? `<div class="ear"><b>Memphis Weather</b>${esc(w.sky)}<br>High ${w.high}&deg; &middot; Low ${w.low}&deg;<br>Rain ${w.rain}%</div>` : `<div class="ear"></div>`;
}

// Front-page briefs run the opening of a story and jump to its section, as a newspaper does.
function frontBrief(s) {
  const words = String(s.body || "").split(/\s+/);
  const opening = words.slice(0, 55).join(" ") + (words.length > 55 ? "…" : "");
  const desk = DESKS.find((d) => d.key === BY_KEY[s.section]?.desk);
  return `<article class="st brief"><div class="kicker">${esc(BY_KEY[s.section]?.name || "")}</div><h3>${esc(s.headline)}</h3>
    ${photo(s, "small")}<div class="body"><p>${s.dateline ? `<b class="dl">${esc(s.dateline)} &mdash;</b> ` : ""}${esc(opening)}</p></div>
    <p class="jump">Continued in ${esc(desk?.name || "")}</p></article>`;
}

function frontPage(ed) {
  const all = Object.values(ed.sections).flat();
  const byId = Object.fromEntries(all.map((s) => [s.id, s]));
  const front = (ed.front || []).map((id) => byId[id]).filter(Boolean);
  const [lead, ...rest] = front;
  const inside = DESKS.map((d) => {
    const top = SECTIONS.filter((s) => s.desk === d.key).flatMap((s) => ed.sections[s.key] || []).sort((a, b) => b.importance - a.importance)[0];
    return top ? `<li><b>${esc(d.name)}</b> ${esc(top.headline)}</li>` : "";
  }).join("");
  return `<section class="pg front-pg">
    <div class="mast">
      ${weatherBox(ed)}
      <div class="title-wrap"><div class="title">Dalton Daily</div><div class="motto">Sourced widely. Told plainly.</div></div>
      <div class="ear right"><b>Vol. I &middot; No. ${ed.number || 1}</b>Sunday Edition<br>daltondaily.com</div>
    </div>
    <div class="dateline"><span>${esc(ed.longDate)}</span><span>Memphis, Tennessee</span><span>Est. 2026</span></div>
    ${lead ? `<article class="front-lead">
      <div class="kicker">${esc(BY_KEY[lead.section]?.name || "")}</div>
      <h1>${esc(lead.headline)}</h1>${lead.dek ? `<p class="dek big">${esc(lead.dek)}</p>` : ""}
      <div class="lead-grid">${lead.image?.src ? `<div>${photo(lead, "hero")}</div>` : ""}
        <div class="body two">${paras(lead.body, lead.dateline)}${lead.why ? `<p class="why"><b>Why it matters:</b> ${esc(lead.why)}</p>` : ""}${srcLine(lead)}</div></div>
    </article>` : ""}
    <div class="front-cols">${rest.map((s) => frontBrief(s)).join("")}</div>
    <aside class="inside"><h4>Inside Today</h4><ul>${inside}</ul></aside>
  </section>`;
}

function marketsBox(quotes) {
  if (!quotes?.length) return "";
  const row = (q) => {
    const up = q.change >= 0;
    const p = q.kind === "yield" ? q.price.toFixed(3) + "%" : q.kind === "fx" ? q.price.toFixed(q.price < 10 ? 4 : 2) : q.price.toLocaleString("en-US", { maximumFractionDigits: q.price >= 1000 ? 0 : 2 });
    return `<tr><td>${esc(q.name)}</td><td>${p}</td><td class="${up ? "up" : "dn"}">${up ? "+" : "&minus;"}${Math.abs(q.change).toFixed(2)}%</td></tr>`;
  };
  return `<aside class="markets"><h4>Markets</h4><table>${quotes.map(row).join("")}</table><p class="src">Prices at press time; day change.</p></aside>`;
}

function deskPage(ed, desk, quotes) {
  const secs = SECTIONS.filter((s) => s.desk === desk.key).map((sec) => ({ sec, stories: ed.sections[sec.key] || [] })).filter((x) => x.stories.length);
  if (!secs.length) return "";
  const all = secs.flatMap((x) => x.stories);
  const top = all.slice().sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0) || b.importance - a.importance)[0];
  const body = secs
    .map(({ sec, stories }) => {
      const list = stories.filter((s) => s !== top);
      if (!list.length) return "";
      return `<h5 class="seclabel">${esc(sec.name)}</h5>${list.map((s) => story(s)).join("")}`;
    })
    .join("");
  return `<section class="pg desk-pg">
    ${folio(ed, desk.name)}
    <h2 class="deskname">${esc(desk.name)}</h2>
    ${feature(top)}
    <div class="cols">${desk.key === "money" ? marketsBox(quotes) : ""}${body}</div>
  </section>`;
}

function reflectionsPage(ed) {
  const d = ed.devotions || {};
  const sc = d.scripture, st = d.stoic, cp = d.commonplace;
  if (!sc && !st && !cp) return "";
  return `<section class="pg refl-pg">
    ${folio(ed, "Reflections")}
    <h2 class="deskname">Reflections</h2>
    <div class="refl">
      ${sc ? `<div><div class="kicker">Daily Scripture</div><h3>${esc(sc.theme || sc.reference)}</h3><p class="ref">${esc(sc.reference)} &middot; ${esc(sc.translation)}</p>
        <p class="verse">${(sc.verses || []).map((v) => `<sup>${v.n}</sup>${esc(v.text)}`).join(" ")}</p><div class="body">${paras(sc.reflection)}</div></div>` : "<div></div>"}
      ${st ? `<div><div class="kicker">Daily Stoic${st.obscure ? " &middot; From the Margins" : ""}</div><h3>${esc(st.author)}</h3><p class="ref">${esc(st.work)}, ${esc(st.citation)}</p>
        <blockquote>${paras(st.passage)}</blockquote><p class="tr">${esc(st.translator)}</p>${st.context ? `<p class="ctx">${esc(st.context)}</p>` : ""}
        <div class="body">${paras(st.reflection)}</div>${st.practice ? `<p class="why"><b>Practice:</b> ${esc(st.practice)}</p>` : ""}</div>` : "<div></div>"}
      ${cp ? `<div><div class="kicker">The Commonplace Book &middot; ${esc(cp.field)}</div><h3>${esc(cp.title)}</h3>${cp.dek ? `<p class="dek">${esc(cp.dek)}</p>` : ""}
        <div class="body">${paras(cp.essay)}</div>${cp.takeaway ? `<p class="why"><b>Remember:</b> ${esc(cp.takeaway)}</p>` : ""}${cp.further ? `<p class="why"><b>Read next:</b> ${esc(cp.further)}</p>` : ""}</div>` : "<div></div>"}
    </div>
  </section>`;
}

function comicsPage(ed) {
  const strips = (ed.comics || []).filter((c) => c.images?.length);
  if (!strips.length) return "";
  const order = ["xkcd", "pdl", "existential", "smbc"];
  strips.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return `<section class="pg comics-pg">
    ${folio(ed, "The Funnies")}
    <h2 class="deskname">The Funnies</h2>
    <div class="comics">${strips
      .map((c) => `<div class="strip k-${esc(c.key)}"><p class="name">${esc(c.strip)} <span>&middot; ${esc(c.author)}</span></p><p class="ttl">${esc(c.title)}${c.classic ? " &middot; from the archive" : ""}</p>
        ${c.images.map((src) => `<img src="${esc(src)}" alt="" referrerpolicy="no-referrer">`).join("")}${c.caption ? `<p class="cap">${esc(c.caption)}</p>` : ""}</div>`)
      .join("")}</div>
  </section>`;
}

const CSS = `
@page{size:11in 17in;margin:0.45in 0.45in 0.5in}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;color:#111;background:#fff;font-family:"Source Serif 4",Georgia,serif;font-size:8.9pt;line-height:1.32}
.pg{break-after:page}
.pg:last-child{break-after:auto}
p{margin:0 0 5pt;text-align:justify;hyphens:auto;orphans:2;widows:2}
h1,h2,h3,h4,h5{font-family:"Playfair Display",Georgia,serif;margin:0;font-weight:900;text-wrap:balance}
.kicker,.seclabel,.folio,.dateline,.ear b,.inside h4,.markets h4,.dl{font-family:"Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em}
.kicker{font-size:6.8pt;font-weight:700;color:#111;margin:0 0 2pt}
.dl{font-size:7pt;font-weight:700;letter-spacing:.06em}
.dek{font-style:italic;color:#333;margin:2pt 0 5pt;line-height:1.25;text-align:left}
.dek.big{font-size:12pt}
.why{font-size:8.2pt;color:#222;text-align:left}
.why b{font-family:"Libre Franklin",Arial,sans-serif;font-size:6.6pt;text-transform:uppercase;letter-spacing:.08em}
.src{font-family:"Libre Franklin",Arial,sans-serif;font-size:6.2pt;color:#555;text-align:left;margin-top:2pt}
figure.ph{margin:0 0 5pt}
figure.ph img{display:block;width:100%;height:1.55in;object-fit:cover;filter:grayscale(1) contrast(1.12) brightness(1.02)}
figure.ph.small img{height:1.25in}
.fphoto figure.ph img{height:3.4in}
figure.ph figcaption{font-family:"Libre Franklin",Arial,sans-serif;font-size:5.8pt;color:#555;text-align:right;margin-top:1.5pt}
figure.ph.hero img{height:4.6in}
/* Front page */
.mast{display:grid;grid-template-columns:1.6in 1fr 1.6in;align-items:center;gap:10pt;padding-bottom:4pt}
.ear{font-family:"Libre Franklin",Arial,sans-serif;font-size:7.4pt;line-height:1.35;border-top:1.5pt solid #111;border-bottom:.6pt solid #111;padding:4pt 2pt}
.ear b{display:block;font-size:6.6pt;margin-bottom:2pt}
.ear.right{text-align:right}
.title{font-family:"UnifrakturMaguntia",serif;font-size:82pt;line-height:.95;text-align:center}
.motto{text-align:center;font-style:italic;font-size:9.5pt;color:#333;margin-top:2pt}
.dateline{display:flex;justify-content:space-between;border-top:3pt double #111;border-bottom:.8pt solid #111;padding:3pt 1pt;font-size:7.4pt;margin-bottom:8pt}
.front-lead h1{font-size:36pt;line-height:1.02;margin:2pt 0 3pt}
.lead-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:12pt;margin-top:4pt;padding-bottom:8pt;border-bottom:.8pt solid #111}
.body.two{column-count:2;column-gap:12pt;column-rule:.4pt solid #999}
.front-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:0 12pt;margin-top:8pt}
.front-cols .st{border-bottom:0;padding:0 0 0 12pt;border-left:.4pt solid #999}
.front-cols .st:first-child{border-left:0;padding-left:0}
.jump{font-family:"Libre Franklin",Arial,sans-serif;font-size:6.6pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-align:left}
.front-cols h3{font-size:15pt}
.inside{margin-top:8pt;border-top:3pt double #111;padding-top:5pt;break-inside:avoid}
.inside h4{font-size:8pt;margin-bottom:4pt}
.inside ul{list-style:none;margin:0;padding:0;column-count:3;column-gap:14pt;column-rule:.4pt solid #999}
.inside li{font-size:8.4pt;line-height:1.25;padding:2pt 0;break-inside:avoid}
.inside li b{font-family:"Libre Franklin",Arial,sans-serif;font-size:6.4pt;text-transform:uppercase;letter-spacing:.1em;display:block}
/* Inside pages */
.folio{display:flex;justify-content:space-between;font-size:6.8pt;border-bottom:.6pt solid #111;padding-bottom:2pt;margin-bottom:6pt}
.folio span:first-child{font-family:"UnifrakturMaguntia",serif;font-size:11pt;letter-spacing:0;text-transform:none}
.deskname{font-size:26pt;text-transform:uppercase;letter-spacing:.06em;text-align:center;border-top:3pt solid #111;border-bottom:.8pt solid #111;padding:3pt 0 2pt;margin-bottom:8pt}
.feature{display:grid;grid-template-columns:1.1fr 1fr;gap:12pt;padding-bottom:8pt;margin-bottom:8pt;border-bottom:.8pt solid #111;break-inside:avoid}
.feature:not(:has(.fphoto)){grid-template-columns:1fr}
.feature h2{font-size:24pt;line-height:1.04;margin-bottom:2pt}
.cols{column-count:5;column-gap:11pt;column-rule:.4pt solid #999;column-fill:auto}
.seclabel{column-span:all;font-size:7.6pt;font-weight:700;border-top:1.4pt solid #111;border-bottom:.4pt solid #999;padding:2pt 0;margin:4pt 0 6pt}
.st{margin:0 0 7pt;padding-bottom:5pt;border-bottom:.4pt solid #bbb}
.st h3{font-size:12.5pt;line-height:1.08;margin-bottom:2pt}
.st .body p:first-child::first-letter{font-weight:700}
.markets{break-inside:avoid;border:.8pt solid #111;padding:5pt;margin-bottom:8pt}
.markets h4{font-size:8pt;margin-bottom:3pt}
.markets table{width:100%;border-collapse:collapse;font-family:"Libre Franklin",Arial,sans-serif;font-size:7pt}
.markets td{padding:1.3pt 0;border-bottom:.3pt solid #ccc}
.markets td:nth-child(2),.markets td:nth-child(3){text-align:right;font-variant-numeric:tabular-nums}
.markets .dn{font-weight:700}
/* Reflections */
.refl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16pt}
.refl>div+div{border-left:.4pt solid #999;padding-left:16pt}
.refl h3{font-size:18pt;margin:2pt 0 3pt}
.refl .ref,.refl .tr{font-family:"Libre Franklin",Arial,sans-serif;font-size:7pt;font-weight:700;letter-spacing:.04em;text-align:left}
.refl .verse,.refl blockquote{font-style:italic;font-size:10.5pt;line-height:1.45}
.refl blockquote{margin:0 0 4pt;padding-left:8pt;border-left:2pt solid #111}
.refl .ctx{font-style:italic;color:#444}
.refl p{text-align:left}
.verse sup{font-style:normal;font-size:6pt;margin-right:1pt}
/* Comics */
.comics{column-count:2;column-gap:18pt;column-rule:.4pt solid #999}
.strip{text-align:center;width:100%;break-inside:avoid;margin-bottom:14pt}
.strip img{display:block;margin:0 auto 4pt;max-width:100%;max-height:7.2in;width:auto}
.strip .name{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:14pt;margin:0;text-align:center}
.strip .name span{font-family:"Libre Franklin",Arial,sans-serif;font-weight:400;font-size:7pt;text-transform:uppercase;letter-spacing:.1em}
.strip .ttl{font-style:italic;text-align:center;margin:0 0 4pt}
.strip .cap{font-size:7.6pt;color:#444;max-width:6in;margin:0 auto;text-align:center}
.screen-note{display:none}
@media screen{body{background:#ccc}.pg{width:11in;min-height:17in;margin:20px auto;padding:.45in;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.25)}}
`;

const SCRIPT = `<script>
document.querySelectorAll('img').forEach(function(img){
  function fail(){var fb=img.getAttribute('data-fallback');if(fb){img.removeAttribute('data-fallback');img.src=fb;return}var f=img.closest('figure');if(f)f.remove();else img.remove()}
  img.addEventListener('error',fail);if(img.complete&&!img.naturalWidth)fail();
});
</script>`;

// Part names the renderer can request one at a time (?only=...), in printing order.
export const PRINT_PARTS = ["front", ...DESKS.map((d) => d.slug), "reflections", "comics"];

export function renderPrint(ed, quotes = [], only = "") {
  const parts = {
    front: () => frontPage(ed),
    reflections: () => reflectionsPage(ed),
    comics: () => comicsPage(ed),
    ...Object.fromEntries(DESKS.map((d) => [d.slug, () => deskPage(ed, d, quotes)])),
  };
  const pages = (only && parts[only] ? [parts[only]()] : PRINT_PARTS.map((k) => parts[k]())).filter(Boolean).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Dalton Daily — Print Edition — ${esc(ed.longDate)}</title>
<meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400&family=Libre+Franklin:wght@400;700&display=block" rel="stylesheet">
<style>${CSS}</style></head><body>${pages}${SCRIPT}</body></html>`;
}

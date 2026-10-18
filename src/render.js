// Newspaper-style HTML for Dalton Daily.
import { DESKS, SECTIONS } from "./sections.js";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

const CSS = `
:root{--paper:#f5f1e6;--ink:#161412;--muted:#5d564c;--rule:#1f1c18;--hair:#bdb4a3;--accent:#8a1c12;--card:#efe9da}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191816;--ink:#e9e3d6;--muted:#a59d8f;--rule:#d9d2c3;--hair:#4a463f;--accent:#e0705f;--card:#211f1c}}
:root[data-theme="dark"]{--paper:#191816;--ink:#e9e3d6;--muted:#a59d8f;--rule:#d9d2c3;--hair:#4a463f;--accent:#e0705f;--card:#211f1c}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Source Serif 4",Georgia,serif;font-size:17px;line-height:1.5}
a{color:inherit}
.page{max-width:1240px;margin:0 auto;padding:20px 16px 60px}
.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;padding-bottom:10px}
.ear{font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;line-height:1.35;color:var(--muted);border:1px solid var(--hair);padding:8px 10px;max-width:220px}
.ear b{display:block;color:var(--ink);letter-spacing:.08em;text-transform:uppercase;font-size:11px;margin-bottom:2px}
.ear.right{justify-self:end;text-align:right}
.title{font-family:"UnifrakturMaguntia",serif;font-weight:400;font-size:clamp(46px,9vw,104px);line-height:1;margin:0;text-align:center;letter-spacing:.01em}
.title a{text-decoration:none}
.motto{text-align:center;font-style:italic;color:var(--muted);font-size:14px;margin-top:4px}
.dateline{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:3px double var(--rule);border-bottom:1px solid var(--rule);padding:6px 2px;font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
nav.index{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 18px;padding:8px 0;border-bottom:1px solid var(--hair);font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
nav.index a{text-decoration:none;color:var(--muted)}
nav.index a:hover{color:var(--accent)}
.front{display:grid;grid-template-columns:2fr 1fr;gap:0;margin-top:18px;border-bottom:3px double var(--rule);padding-bottom:18px}
.lead{padding-right:22px;border-right:1px solid var(--hair)}
.lead h2{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:clamp(30px,4.4vw,52px);line-height:1.05;margin:4px 0 10px}
.lead .dek{font-size:21px}
.lead .body{column-count:2;column-gap:22px;column-rule:1px solid var(--hair)}
.lead .body p:first-child:not(:has(.dl))::first-letter{font-family:"Playfair Display",Georgia,serif;float:left;font-size:64px;line-height:.85;padding:6px 8px 0 0;font-weight:900}
.side{padding-left:22px}
.side .brief{padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid var(--hair)}
.side .brief:last-child{border-bottom:0;margin-bottom:0}
.side h3{font-family:"Playfair Display",Georgia,serif;font-size:22px;line-height:1.15;margin:2px 0 6px}
.side h3 a{text-decoration:none}
.side h3 a:hover{text-decoration:underline}
.kicker{font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.dek{font-style:italic;color:var(--muted);margin:0 0 8px;line-height:1.35}
.body p{margin:0 0 10px;text-align:justify;hyphens:auto}
.dl{font-family:"Libre Franklin",Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.why{font-size:15px;color:var(--muted);border-left:3px solid var(--accent);padding:2px 0 2px 10px;margin:8px 0}
.why b{font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
.src{font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}
.src a{color:var(--muted)}
.kind{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--hair);padding:0 4px;color:var(--accent)}
.upd{display:inline-block;background:var(--accent);color:var(--paper);font-family:"Libre Franklin",Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;padding:1px 5px;margin-right:6px;vertical-align:middle}
.vote{margin-left:auto;display:inline-flex;gap:4px}
.vote button{font:inherit;font-size:12px;background:none;border:1px solid var(--hair);color:var(--muted);padding:1px 7px;cursor:pointer;border-radius:2px}
.vote button.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.desk{margin-top:30px}
.desk>h2{font-family:"Playfair Display",Georgia,serif;font-weight:900;text-transform:uppercase;letter-spacing:.06em;font-size:26px;text-align:center;margin:0;padding:6px 0;border-top:3px solid var(--rule);border-bottom:1px solid var(--rule)}
.sec{margin-top:16px}
.sec>h3{font-family:"Libre Franklin",Arial,sans-serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 10px;padding-bottom:4px;border-bottom:1px solid var(--hair);color:var(--accent)}
.cols{column-count:3;column-gap:26px;column-rule:1px solid var(--hair)}
.story{break-inside:avoid;margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid var(--hair)}
.story h4{font-family:"Playfair Display",Georgia,serif;font-size:22px;line-height:1.15;margin:0 0 6px}
.story.top h4{font-size:27px}
.missing{font-style:italic;color:var(--muted)}
.comics{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
.strip{background:var(--card);border:1px solid var(--rule);padding:12px}
.strip .name{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:20px;margin:0}
.strip .by{font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.strip .ttl{font-style:italic;margin:0 0 8px}
.strip img{display:block;width:100%;height:auto;background:#fff;margin:0 0 8px;border:1px solid var(--hair)}
.strip .cap{font-size:14px;color:var(--muted);margin:0 0 6px}
.strip .go{display:inline-block;margin-top:6px;font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border:1px solid var(--ink);padding:6px 10px}
.strip.wide{grid-column:1/-1}
.reflect{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:22px;border:1px solid var(--rule);background:var(--card)}
.reflect>div{padding:16px 18px}
.reflect>div+div{border-left:1px solid var(--hair)}
.reflect h3{font-family:"Playfair Display",Georgia,serif;font-size:24px;line-height:1.15;margin:4px 0 8px}
.reflect .ref{font-family:"Libre Franklin",Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:.06em}
.verse{font-style:italic;margin:0 0 10px;line-height:1.55}
.verse sup{font-style:normal;font-size:10px;color:var(--muted);margin-right:3px}
.reflect .body p{text-align:left}
.reflect .note{font-size:15px;margin:8px 0}
.reflect .note b{font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
footer{margin-top:40px;border-top:3px double var(--rule);padding-top:10px;font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:space-between}
.notice{background:var(--card);border:1px solid var(--hair);padding:10px 14px;margin-top:14px;font-size:15px}
.archive{list-style:none;padding:0;column-count:3;column-gap:30px}
.archive li{padding:6px 0;border-bottom:1px solid var(--hair);break-inside:avoid}
@media (max-width:900px){.cols{column-count:2}.lead .body{column-count:1}}
@media (max-width:700px){
 body{font-size:16px}
 .mast{grid-template-columns:1fr}.ear{display:none}
 .front{grid-template-columns:1fr}.lead{padding-right:0;border-right:0;border-bottom:1px solid var(--hair);padding-bottom:14px}.side{padding-left:0;padding-top:14px}
 .cols{column-count:1}.comics{grid-template-columns:1fr}.reflect{grid-template-columns:1fr}.reflect>div+div{border-left:0;border-top:1px solid var(--hair)}.archive{column-count:1}
 .dateline{justify-content:center}
}
`;

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Libre+Franklin:wght@400;700&display=swap" rel="stylesheet">';

const SCRIPT = `
<script>
(function(){
  var store={};try{store=JSON.parse(localStorage.getItem('dd_votes')||'{}')}catch(e){}
  document.querySelectorAll('.vote').forEach(function(v){
    var id=v.dataset.id;
    if(store[id]){var b=v.querySelector('[data-v="'+store[id]+'"]');if(b)b.classList.add('on')}
    v.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      var val=Number(b.dataset.v);
      fetch('/api/vote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:id,section:v.dataset.section,vote:val})})
      .then(function(r){if(!r.ok)throw 0;v.querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');store[id]=val;try{localStorage.setItem('dd_votes',JSON.stringify(store))}catch(e){}})
      .catch(function(){b.textContent='!'});
    });
  });
})();
</script>`;

function shell(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="robots" content="noindex,nofollow">${FONTS}<style>${CSS}</style></head>
<body><div class="page">${inner}</div>${SCRIPT}</body></html>`;
}

function masthead(ed) {
  const w = ed?.weather;
  const weather = w
    ? `<b>Memphis Weather</b>${esc(w.sky)}. High ${w.high}°, low ${w.low}°.<br>Chance of rain ${w.rain}%.`
    : `<b>Memphis Weather</b>Forecast unavailable.`;
  return `
<header>
  <div class="mast">
    <div class="ear">${weather}</div>
    <div><h1 class="title"><a href="/">Dalton Daily</a></h1><div class="motto">All the news fit for one reader</div></div>
    <div class="ear right"><b>Vol. I &middot; No. ${ed?.number || 1}</b>Private edition<br>Printed for the publisher</div>
  </div>
  <div class="dateline"><span>${esc(ed?.longDate || "")}</span><span>Memphis, Tennessee</span><span>Est. 2026</span></div>
  <nav class="index">
    <a href="#front">Front Page</a>
    <a href="#reflections">Reflections</a>
    ${DESKS.map((d) => `<a href="#desk-${d.key}">${esc(d.name)}</a>`).join("")}
    <a href="#comics">Comics</a>
  </nav>
</header>`;
}

function paragraphs(body = "", dateline) {
  const lead = dateline ? `<span class="dl">${esc(dateline)} &mdash; </span>` : "";
  return body
    .split(/\n{2,}|\n/)
    .filter(Boolean)
    .map((p, i) => `<p>${i === 0 ? lead : ""}${esc(p)}</p>`)
    .join("");
}

function sourcesLine(s) {
  const links = s.sources
    .map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>${x.kind && x.kind !== "legacy" && x.kind !== "wire" ? ` <span class="kind">${esc(x.kind)}</span>` : ""}`)
    .join(" &middot; ");
  return `<div class="src">${links}<span class="vote" data-id="${esc(s.id)}" data-section="${esc(s.section)}"><button data-v="1" title="More like this">&#9650;</button><button data-v="-1" title="Less like this">&#9660;</button></span></div>`;
}

function storyBlock(s, top) {
  return `<article class="story${top ? " top" : ""}" id="s-${esc(s.id)}">
  <h4>${s.update ? '<span class="upd">UPDATE</span>' : ""}${esc(s.headline)}</h4>
  ${s.dek ? `<p class="dek">${esc(s.dek)}</p>` : ""}
  <div class="body">${paragraphs(s.body, s.dateline)}</div>
  ${s.why ? `<p class="why"><b>Why it matters</b> ${esc(s.why)}</p>` : ""}
  ${sourcesLine(s)}
</article>`;
}

function frontPage(ed) {
  const all = Object.values(ed.sections).flat();
  const byId = Object.fromEntries(all.map((s) => [s.id, s]));
  const picks = (ed.front || []).map((id) => byId[id]).filter(Boolean);
  if (!picks.length) return "";
  const [lead, ...rest] = picks;
  const label = (s) => SECTION_BY_KEY[s.section]?.name || "";
  return `
<section class="front" id="front">
  <div class="lead">
    <div class="kicker">${esc(label(lead))}</div>
    <h2>${lead.update ? '<span class="upd">UPDATE</span>' : ""}${esc(lead.headline)}</h2>
    ${lead.dek ? `<p class="dek">${esc(lead.dek)}</p>` : ""}
    <div class="body">${paragraphs(lead.body, lead.dateline)}</div>
    ${lead.why ? `<p class="why"><b>Why it matters</b> ${esc(lead.why)}</p>` : ""}
    ${sourcesLine(lead)}
  </div>
  <div class="side">
    ${rest
      .map(
        (s) => `<div class="brief"><div class="kicker">${esc(label(s))}</div>
      <h3><a href="#s-${esc(s.id)}">${esc(s.headline)}</a></h3>
      ${s.dek ? `<p class="dek">${esc(s.dek)}</p>` : ""}</div>`
      )
      .join("")}
  </div>
</section>`;
}

function reflections(ed) {
  const sc = ed.devotions?.scripture;
  const sl = ed.devotions?.slaa;
  if (!sc && !sl) return "";
  const scripture = sc
    ? `<div><div class="kicker">Daily Scripture</div>
      <h3>${esc(sc.theme || sc.reference)}</h3>
      <div class="ref"><a href="${esc(sc.link)}" target="_blank" rel="noopener">${esc(sc.reference)}</a> &middot; ${esc(sc.translation)}</div>
      ${sc.verses.length ? `<p class="verse">${sc.verses.map((v) => `<sup>${v.n}</sup>${esc(v.text)}`).join(" ")}</p>` : ""}
      <div class="body">${paragraphs(sc.reflection)}</div></div>`
    : `<div><div class="kicker">Daily Scripture</div><p class="missing">Not available this morning.</p></div>`;
  const slaa = sl
    ? `<div><div class="kicker">Daily SLAA Reading</div>
      <h3>${esc(sl.title)}</h3>
      <div class="ref">From <a href="${esc(sl.url)}" target="_blank" rel="noopener">${esc(sl.source)}</a></div>
      <div class="body" style="margin-top:8px">${paragraphs(sl.reading)}</div>
      ${sl.practice ? `<p class="note"><b>Today</b> ${esc(sl.practice)}</p>` : ""}
      ${sl.question ? `<p class="note"><b>Reflect</b> ${esc(sl.question)}</p>` : ""}</div>`
    : `<div><div class="kicker">Daily SLAA Reading</div><p class="missing">Not available this morning.</p></div>`;
  return `<section class="reflect" id="reflections">${scripture}${slaa}</section>`;
}

function desks(ed) {
  const frontIds = new Set((ed.front || []).slice(0, 1)); // lead story already printed in full
  return DESKS.map((d) => {
    const secs = SECTIONS.filter((s) => s.desk === d.key);
    const inner = secs
      .map((sec) => {
        const stories = (ed.sections[sec.key] || []).filter((s) => !frontIds.has(s.id));
        const content = stories.length
          ? `<div class="cols">${stories.map((s, i) => storyBlock(s, i === 0)).join("")}</div>`
          : `<p class="missing">${ed.errors?.[sec.key] ? "This section could not be filed this morning." : "No stories this morning."}</p>`;
        return `<section class="sec" id="sec-${sec.key}"><h3>${esc(sec.name)}</h3>${content}</section>`;
      })
      .join("");
    return `<section class="desk" id="desk-${d.key}"><h2>${esc(d.name)}</h2>${inner}</section>`;
  }).join("");
}

function comicsPage(ed) {
  const strips = (ed.comics || [])
    .map((c) => {
      if (c.linkOnly) {
        return `<div class="strip"><p class="name">${esc(c.strip)}</p><div class="by">${esc(c.author)}</div>
        <p class="cap">${esc(c.caption)}</p><a class="go" href="${esc(c.link)}" target="_blank" rel="noopener">Read today's strip &rarr;</a></div>`;
      }
      const imgs = c.images.map((src) => `<img src="${esc(src)}" alt="${esc(c.title)}" loading="eager" referrerpolicy="no-referrer">`).join("");
      const wide = c.key === "existential" || c.key === "smbc";
      return `<div class="strip${wide ? " wide" : ""}"><p class="name">${esc(c.strip)}</p><div class="by">${esc(c.author)}${c.license ? ` &middot; ${esc(c.license)}` : ""}</div>
      <p class="ttl">${esc(c.title)}</p>${imgs}${c.caption ? `<p class="cap">${esc(c.caption)}</p>` : ""}
      <a class="go" href="${esc(c.link)}" target="_blank" rel="noopener">View at source &rarr;</a></div>`;
    })
    .join("");
  return `<section class="desk" id="comics"><h2>The Funnies</h2><div class="comics">${strips}</div></section>`;
}

export function renderEdition(ed, { notice } = {}) {
  const failed = Object.keys(ed.errors || {});
  const inner = `
${masthead(ed)}
${notice ? `<div class="notice">${notice}</div>` : ""}
${frontPage(ed)}
${reflections(ed)}
${desks(ed)}
${comicsPage(ed)}
<footer>
  <span><a href="/archive">Archive</a> &middot; <a href="/admin/status">Press room</a></span>
  <span>Filed ${esc(new Date(ed.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }))} CT &middot; ${ed.searches || 0} searches${failed.length ? ` &middot; missing: ${esc(failed.join(", "))}` : ""}</span>
</footer>`;
  return shell(`Dalton Daily — ${ed.longDate}`, inner);
}

export function renderArchive(rows) {
  const items = rows
    .map((r) => `<li><a href="/${esc(r.date)}">${esc(new Date(r.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }))}</a></li>`)
    .join("");
  return shell(
    "Dalton Daily — Archive",
    `${masthead(null)}<section class="desk"><h2>The Morgue</h2>${items ? `<ul class="archive">${items}</ul>` : `<p class="missing">No editions yet.</p>`}</section>`
  );
}

export function renderMessage(title, html) {
  return shell(`Dalton Daily — ${title}`, `${masthead(null)}<div class="notice">${html}</div>`);
}

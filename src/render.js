// Newspaper-style HTML for Dalton Daily.
import { DESKS, SECTIONS } from "./sections.js";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));
const label = (s) => SECTION_BY_KEY[s.section]?.name || "";

const CSS = `
:root{--paper:#f6f2e8;--ink:#17140f;--muted:#5f574b;--rule:#211d17;--hair:#cbc2b1;--accent:#8a1c12;--card:#efe8d8;--photo:#e4ddcc}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#181714;--ink:#ebe5d8;--muted:#a69e90;--rule:#dcd5c6;--hair:#46423b;--accent:#e2735f;--card:#201e1a;--photo:#2a2723}}
:root[data-theme="dark"]{--paper:#181714;--ink:#ebe5d8;--muted:#a69e90;--rule:#dcd5c6;--hair:#46423b;--accent:#e2735f;--card:#201e1a;--photo:#2a2723}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Source Serif 4",Georgia,serif;font-size:17px;line-height:1.52;font-optical-sizing:auto}
a{color:inherit}
.page{max-width:1280px;margin:0 auto;padding:22px 20px 70px}

/* Masthead */
.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding-bottom:12px}
.ear{font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;line-height:1.4;color:var(--muted);border-top:2px solid var(--rule);border-bottom:1px solid var(--rule);padding:7px 2px;max-width:210px}
.ear b{display:block;color:var(--ink);letter-spacing:.12em;text-transform:uppercase;font-size:10.5px;margin-bottom:3px}
.ear.right{justify-self:end;text-align:right}
.title{font-family:"UnifrakturMaguntia",serif;font-weight:400;font-size:clamp(50px,9.5vw,112px);line-height:.95;margin:0;text-align:center}
.title a{text-decoration:none}
.motto{text-align:center;font-style:italic;color:var(--muted);font-size:14px;margin-top:6px}
.dateline{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:4px double var(--rule);border-bottom:1px solid var(--rule);padding:7px 2px;font-family:"Libre Franklin",Arial,sans-serif;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase}
nav.index{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 20px;padding:9px 0;border-bottom:1px solid var(--hair);font-family:"Libre Franklin",Arial,sans-serif;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase}
nav.index a{text-decoration:none;color:var(--muted)}
nav.index a:hover{color:var(--accent)}

/* Shared type */
.kicker{font-family:"Libre Franklin",Arial,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:5px}
h2,h3,h4{font-family:"Playfair Display",Georgia,serif;font-weight:700;margin:0;text-wrap:balance}
h4 a,h3 a{text-decoration:none}
h4 a:hover,h3 a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.dek{font-style:italic;color:var(--muted);margin:6px 0 10px;line-height:1.38;text-wrap:pretty}
.body p{margin:0 0 10px;text-align:justify;hyphens:auto;text-wrap:pretty}
.dl{font-family:"Libre Franklin",Arial,sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase}
.why{font-size:15px;color:var(--muted);border-left:2px solid var(--accent);padding:1px 0 1px 10px;margin:8px 0 10px}
.why b{font-family:"Libre Franklin",Arial,sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-right:4px}
.src{font-family:"Libre Franklin",Arial,sans-serif;font-size:11.5px;color:var(--muted);display:flex;flex-wrap:wrap;gap:3px 9px;align-items:center}
.src a{color:var(--muted)}
.kind{font-size:8.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--hair);padding:0 4px;color:var(--accent)}
.upd{display:inline-block;background:var(--accent);color:var(--paper);font-family:"Libre Franklin",Arial,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:.12em;padding:2px 5px;margin-right:7px;vertical-align:.25em}
.vote{margin-left:auto;display:inline-flex;gap:4px}
.vote button{font:inherit;font-size:11px;background:none;border:1px solid var(--hair);color:var(--muted);padding:0 7px;cursor:pointer;border-radius:2px;line-height:1.7}
.vote button.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}

/* Photos */
figure.ph{margin:0 0 12px}
figure.ph .frame{background:var(--photo);overflow:hidden}
figure.ph img{display:block;width:100%;height:100%;aspect-ratio:3/2;object-fit:cover;filter:saturate(.88) contrast(1.04);transition:filter .3s}
figure.ph.wide img{aspect-ratio:16/9}
figure.ph:hover img{filter:none}
figure.ph figcaption{font-family:"Libre Franklin",Arial,sans-serif;font-size:10.5px;letter-spacing:.04em;color:var(--muted);margin-top:5px;text-align:right}

/* Front page */
.front{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(0,1fr);margin-top:20px;padding-bottom:22px;border-bottom:4px double var(--rule)}
.lead{padding-right:26px;border-right:1px solid var(--hair)}
.lead h2{font-size:clamp(32px,4.4vw,54px);line-height:1.04;font-weight:900;letter-spacing:-.01em}
.lead .dek{font-size:21px}
.lead .body{column-count:2;column-gap:26px;column-rule:1px solid var(--hair)}
.lead .body p:first-child:not(:has(.dl))::first-letter{font-family:"Playfair Display",Georgia,serif;float:left;font-size:66px;line-height:.84;padding:6px 8px 0 0;font-weight:900}
.side{padding-left:26px;display:flex;flex-direction:column}
.side .brief{padding:0 0 15px;margin:0 0 15px;border-bottom:1px solid var(--hair)}
.side .brief:last-child{border-bottom:0;margin-bottom:0;padding-bottom:0}
.side h3{font-size:22px;line-height:1.16}
.side .brief:first-child h3{font-size:25px}

/* In pictures */
.pics{margin-top:24px}
.band{display:flex;align-items:center;gap:14px;margin:0 0 14px;font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.band::before,.band::after{content:"";flex:1;border-top:1px solid var(--rule)}
.pics .row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}
.pics h4{font-size:19px;line-height:1.2}
.pics figure.ph img{aspect-ratio:4/3}

/* Reflections */
.reflect{display:grid;grid-template-columns:1fr 1fr;margin-top:28px;border-top:2px solid var(--rule);border-bottom:2px solid var(--rule);background:var(--card)}
.reflect>div{padding:20px 24px}
.reflect>div+div{border-left:1px solid var(--hair)}
.reflect h3{font-size:25px;line-height:1.15;margin:2px 0 8px}
.reflect .ref{font-family:"Libre Franklin",Arial,sans-serif;font-weight:700;font-size:12.5px;letter-spacing:.05em;margin-bottom:10px}
.verse{font-style:italic;margin:0 0 12px;line-height:1.6;font-size:18px}
.verse sup{font-style:normal;font-size:10px;color:var(--muted);margin-right:3px}
.reflect .body p{text-align:left}
.reflect .note{font-size:15px;margin:8px 0}
.reflect .note b{font-family:"Libre Franklin",Arial,sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;margin-right:4px}

/* Desks and sections */
.desk{margin-top:44px}
.desk>h2{font-weight:900;text-transform:uppercase;letter-spacing:.08em;font-size:28px;text-align:center;padding:8px 0 7px;border-top:4px double var(--rule);border-bottom:1px solid var(--rule)}
.sec{margin-top:22px}
.sec>h3{display:flex;align-items:center;gap:12px;font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 14px}
.sec>h3::after{content:"";flex:1;border-top:1px solid var(--hair)}
.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0 28px}
.c6{grid-column:span 6}.c3{grid-column:span 3}.c2{grid-column:span 2}
.feat h4{font-size:31px;line-height:1.1;font-weight:900}
.feat .dek{font-size:18.5px}
.feat .body{column-count:2;column-gap:26px;column-rule:1px solid var(--hair)}
.feat.c6 .body{column-count:3}
.feat.c6.split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:0 30px;align-items:start}
.feat.c6.split .body{column-count:1}
.story h4{font-size:21px;line-height:1.17}
.cell{border-top:1px solid var(--hair);padding-top:16px;margin-top:22px}
.cell h4{font-size:22px}
.cell.top{border-top:0;padding-top:0;margin-top:0}
.feat.cell h4{font-size:27px}
.story .body::after{content:"";display:table;clear:both}
.missing{font-style:italic;color:var(--muted)}

/* Comics */
.comics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:18px;align-items:start}
.strip{border-top:2px solid var(--rule);padding-top:10px}
.strip.wide{grid-column:1/-1}
.strip .name{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:22px;margin:0}
.strip .by{font-family:"Libre Franklin",Arial,sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:2px 0 8px}
.strip .ttl{font-style:italic;margin:0 0 10px}
.strip img{display:block;max-width:100%;height:auto;margin:0 auto 10px;background:#fff}
.strip .cap{font-size:14.5px;color:var(--muted);margin:0 0 6px}
.strip .go{font-family:"Libre Franklin",Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

footer{margin-top:48px;border-top:4px double var(--rule);padding-top:10px;font-family:"Libre Franklin",Arial,sans-serif;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:space-between}
.notice{background:var(--card);border:1px solid var(--hair);padding:10px 14px;margin-top:14px;font-size:15px}
.archive{list-style:none;padding:0;column-count:3;column-gap:30px}
.archive li{padding:6px 0;border-bottom:1px solid var(--hair);break-inside:avoid}

@media (max-width:1000px){
 .pics .row{grid-template-columns:repeat(2,minmax(0,1fr))}
 .lead .body,.feat .body,.feat.c6 .body{column-count:1}
 .c2{grid-column:span 3}
 .feat.c6.split{grid-template-columns:1fr}
}
@media (max-width:700px){
 body{font-size:16.5px}.page{padding:16px 16px 60px}
 .mast{grid-template-columns:1fr}.ear{display:none}
 .front{grid-template-columns:1fr}.lead{padding-right:0;border-right:0;border-bottom:1px solid var(--hair);padding-bottom:16px}.side{padding-left:0;padding-top:16px}
 .c3{grid-column:span 6}.feat.c6.split{display:block}
 .reflect{grid-template-columns:1fr}.reflect>div+div{border-left:0;border-top:1px solid var(--hair)}
 .comics{grid-template-columns:1fr}.archive{column-count:1}
 .dateline{justify-content:center}.feat h4{font-size:27px}
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
  // A photo that fails to load (or is a 1px tracker) disappears instead of leaving a hole.
  function check(img){if(img.naturalWidth&&img.naturalWidth<80){drop(img)}}
  function drop(img){var f=img.closest('figure');if(f)f.remove()}
  document.querySelectorAll('figure.ph img').forEach(function(img){
    img.addEventListener('error',function(){drop(img)});
    img.addEventListener('load',function(){check(img)});
    if(img.complete){img.naturalWidth?check(img):drop(img)}
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

function photo(s, cls = "") {
  if (!s.image?.src) return "";
  return `<figure class="ph ${cls}"><div class="frame"><img src="${esc(s.image.src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><figcaption>${esc(s.image.credit || "")}</figcaption></figure>`;
}

function sourcesLine(s) {
  const links = s.sources
    .map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>${x.kind && x.kind !== "legacy" && x.kind !== "wire" ? ` <span class="kind">${esc(x.kind)}</span>` : ""}`)
    .join(" &middot; ");
  return `<div class="src">${links}<span class="vote" data-id="${esc(s.id)}" data-section="${esc(s.section)}"><button data-v="1" title="More like this">&#9650;</button><button data-v="-1" title="Less like this">&#9660;</button></span></div>`;
}

const head = (s) => `${s.update ? '<span class="upd">UPDATE</span>' : ""}${esc(s.headline)}`;
const dek = (s) => (s.dek ? `<p class="dek">${esc(s.dek)}</p>` : "");
const why = (s) => (s.why ? `<p class="why"><b>Why it matters</b>${esc(s.why)}</p>` : "");

// Story variants: the feature leads a section; cells fill the rows below it.
function feature(s, span, extra = "") {
  if (span === "c6" && s.image) {
    return `<article class="story feat c6 split ${extra}" id="s-${esc(s.id)}">${photo(s, "wide")}<div>
      <h4>${head(s)}</h4>${dek(s)}<div class="body">${paragraphs(s.body, s.dateline)}</div>${why(s)}${sourcesLine(s)}</div></article>`;
  }
  return `<article class="story feat ${span} ${extra}" id="s-${esc(s.id)}">${photo(s, "wide")}
    <h4>${head(s)}</h4>${dek(s)}<div class="body">${paragraphs(s.body, s.dateline)}</div>${why(s)}${sourcesLine(s)}</article>`;
}

function cell(s, span, extra = "") {
  return `<article class="story cell ${span} ${extra}" id="s-${esc(s.id)}">${photo(s)}<h4>${head(s)}</h4>${dek(s)}
    <div class="body">${paragraphs(s.body, s.dateline)}</div>${why(s)}${sourcesLine(s)}</article>`;
}

// Lays a section out so rows stay balanced: a full-width feature (photo beside text), then the rest in even rows.
function sectionGrid(stories) {
  const order = stories.slice();
  if (!order[0].image && order[1]?.image) [order[0], order[1]] = [order[1], order[0]]; // a picture leads when it can
  if (order.length === 2) {
    // Side by side only when both or neither carry a photo; otherwise stack so nothing sits beside a gap.
    if (!!order[0].image === !!order[1].image) return `<div class="grid">${order.map((s) => cell(s, "c3", "top")).join("")}</div>`;
    return `<div class="grid">${feature(order[0], "c6")}${feature(order[1], "c6", "cell")}</div>`;
  }
  const [feat, ...rest] = order;
  let html = `<div class="grid">${feature(feat, "c6")}`;
  if (rest.length === 1) html += feature(rest[0], "c6", "cell");
  else {
    const span = rest.length % 3 === 0 ? "c2" : "c3";
    html += rest.map((s) => cell(s, span)).join("");
  }
  return html + "</div>";
}

function storiesById(ed) {
  return Object.fromEntries(Object.values(ed.sections).flat().map((s) => [s.id, s]));
}

function frontPage(ed) {
  const byId = storiesById(ed);
  const picks = (ed.front || []).map((id) => byId[id]).filter(Boolean);
  if (!picks.length) return "";
  const [lead, ...rest] = picks;
  return `
<section class="front" id="front">
  <div class="lead">
    ${photo(lead, "wide")}
    <div class="kicker">${esc(label(lead))}</div>
    <h2>${head(lead)}</h2>
    ${lead.dek ? `<p class="dek">${esc(lead.dek)}</p>` : ""}
    <div class="body">${paragraphs(lead.body, lead.dateline)}</div>
    ${why(lead)}
    ${sourcesLine(lead)}
  </div>
  <div class="side">
    ${rest
      .map(
        (s, i) => `<div class="brief">${i === 0 ? photo(s) : ""}<div class="kicker">${esc(label(s))}</div>
      <h3><a href="#s-${esc(s.id)}">${esc(s.headline)}</a></h3>${dek(s)}</div>`
      )
      .join("")}
  </div>
</section>`;
}

function inPictures(ed) {
  const byId = storiesById(ed);
  const picks = (ed.pictures || []).map((id) => byId[id]).filter(Boolean);
  if (picks.length < 2) return "";
  const shown = picks.slice(0, picks.length >= 4 ? 4 : 2);
  return `<section class="pics"><div class="band">In Pictures</div><div class="row">
    ${shown.map((s) => `<div>${photo(s)}<div class="kicker">${esc(label(s))}</div><h4><a href="#s-${esc(s.id)}">${esc(s.headline)}</a></h4></div>`).join("")}
  </div></section>`;
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
      <div class="body">${paragraphs(sl.reading)}</div>
      ${sl.practice ? `<p class="note"><b>Today</b>${esc(sl.practice)}</p>` : ""}
      ${sl.question ? `<p class="note"><b>Reflect</b>${esc(sl.question)}</p>` : ""}</div>`
    : `<div><div class="kicker">Daily SLAA Reading</div><p class="missing">Not available this morning.</p></div>`;
  return `<section class="reflect" id="reflections">${scripture}${slaa}</section>`;
}

function desks(ed) {
  const leadId = (ed.front || [])[0]; // the lead story is already printed in full on the front page
  return DESKS.map((d) => {
    const inner = SECTIONS.filter((s) => s.desk === d.key)
      .map((sec) => {
        const stories = (ed.sections[sec.key] || []).filter((s) => s.id !== leadId);
        if (!stories.length) {
          if (sec.optional && !ed.errors?.[sec.key]) return "";
          return `<section class="sec" id="sec-${sec.key}"><h3>${esc(sec.name)}</h3><p class="missing">${ed.errors?.[sec.key] ? "This section could not be filed this morning." : "No stories this morning."}</p></section>`;
        }
        return `<section class="sec" id="sec-${sec.key}"><h3>${esc(sec.name)}</h3>${sectionGrid(stories)}</section>`;
      })
      .join("");
    return inner ? `<section class="desk" id="desk-${d.key}"><h2>${esc(d.name)}</h2>${inner}</section>` : "";
  }).join("");
}

function comicsPage(ed) {
  const strips = (ed.comics || [])
    .filter((c) => !c.linkOnly && c.images?.length)
    .map((c) => {
      const imgs = c.images.map((src) => `<img src="${esc(src)}" alt="${esc(c.title)}" loading="lazy" referrerpolicy="no-referrer">`).join("");
      const wide = c.key === "existential";
      return `<div class="strip${wide ? " wide" : ""}"><p class="name">${esc(c.strip)}</p><div class="by">${esc(c.author)}${c.license ? ` &middot; ${esc(c.license)}` : ""}</div>
      <p class="ttl">${esc(c.title)}</p>${imgs}${c.caption ? `<p class="cap">${esc(c.caption)}</p>` : ""}
      <a class="go" href="${esc(c.link)}" target="_blank" rel="noopener">View at source &rarr;</a></div>`;
    })
    .join("");
  return strips ? `<section class="desk" id="comics"><h2>The Funnies</h2><div class="comics">${strips}</div></section>` : "";
}

export function renderEdition(ed, { notice } = {}) {
  const failed = Object.keys(ed.errors || {});
  const inner = `
${masthead(ed)}
${notice ? `<div class="notice">${notice}</div>` : ""}
${frontPage(ed)}
${inPictures(ed)}
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

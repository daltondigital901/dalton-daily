// Lead images for stories: the og:image / twitter:image each publisher sets as its share picture.
// Tries the story's sources in order, skips site-wide default images and logos.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const BAD = /(logo|favicon|default|placeholder|sprite|blank|avatar|icon|social[-_]?share|og[-_]?default|fallback)/i;

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&#47;/g, "/").replace(/&quot;/g, '"').trim();
}

function findMeta(html, names) {
  for (const name of names) {
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i").exec(html);
    if (a) return a[1];
    const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, "i").exec(html);
    if (b) return b[1];
  }
  return null;
}

async function imageFor(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 7000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: ctl.signal,
    });
    if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) return null;
    // Only the head matters; cap what we read.
    const reader = res.body.getReader();
    let html = "";
    const dec = new TextDecoder();
    while (html.length < 400000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    try { reader.cancel(); } catch {}
    const raw = findMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
    if (!raw) return null;
    const src = new URL(decode(raw), res.url || url).toString();
    if (!/^https:\/\//.test(src) || BAD.test(src) || /\.(svg|gif)(\?|$)/i.test(src)) return null;
    return src;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n]);
      }
    })
  );
  return out;
}

const WIKI_UA = { "user-agent": "DaltonDaily/1.0 (https://www.daltondaily.com; personal newspaper)" };

// Wikipedia lead image for the best-matching article, then Wikimedia Commons, as a fallback photo.
async function wikiImages(query) {
  if (!query) return [];
  const out = [];
  try {
    const u = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=pageimages&piprop=thumbnail&pithumbsize=1280`;
    const j = await (await fetch(u, { headers: WIKI_UA })).json();
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
    for (const p of pages) {
      const src = p.thumbnail?.source;
      if (src && p.thumbnail.width >= 400 && !/(flag|logo|seal|coat_of_arms|map|icon|signature)/i.test(src)) out.push({ src, credit: "Wikipedia" });
    }
  } catch {}
  try {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&gsrlimit=6&prop=imageinfo&iiprop=url|size&iiurlwidth=1280`;
    const j = await (await fetch(u, { headers: WIKI_UA })).json();
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (ii?.thumburl && ii.width >= 600 && !/(logo|flag|map|seal|icon|diagram|chart|signature)/i.test(p.title)) out.push({ src: ii.thumburl, credit: "Wikimedia Commons" });
    }
  } catch {}
  return out;
}

// sections: { key: [story...] }, defaults: { key: "fallback query" } -> { "key:index": { src, credit, fallback? } }
// Every story gets a picture: the publisher's own share image when there is one, otherwise (and as a
// backup if that image will not load) a Wikipedia or Wikimedia Commons photo of the story's subject.
export async function findImages(sections, defaults = {}) {
  const jobs = [];
  for (const [key, stories] of Object.entries(sections)) {
    stories.forEach((s, i) => jobs.push({ key, slot: `${key}:${i}`, sources: (s.sources || []).slice(0, 4), query: s.imageQuery || "" }));
  }
  const og = await pool(jobs, 10, async (job) => {
    for (const src of job.sources) {
      const img = await imageFor(src.url);
      if (img) return { src: img, credit: src.name };
    }
    return null;
  });
  const counts = {};
  for (const f of og) if (f) counts[f.src] = (counts[f.src] || 0) + 1;

  const wiki = await pool(jobs, 8, async (job) => {
    let list = await wikiImages(job.query);
    if (!list.length && defaults[job.key]) list = await wikiImages(defaults[job.key]);
    return list;
  });

  const used = new Set();
  const map = {};
  jobs.forEach((job, n) => {
    const own = og[n] && counts[og[n].src] === 1 ? og[n] : null;
    const alt = (wiki[n] || []).find((w) => !used.has(w.src)) || (wiki[n] || [])[0] || null;
    if (own) {
      used.add(own.src);
      map[job.slot] = alt ? { ...own, fallback: alt.src, fallbackCredit: alt.credit } : own;
    } else if (alt) {
      used.add(alt.src);
      map[job.slot] = alt;
    }
  });
  return map;
}

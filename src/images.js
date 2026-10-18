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

// sections: { key: [story...] } -> { "key:index": { src, credit } }
export async function findImages(sections) {
  const jobs = [];
  for (const [key, stories] of Object.entries(sections)) {
    stories.forEach((s, i) => jobs.push({ slot: `${key}:${i}`, sources: (s.sources || []).slice(0, 3) }));
  }
  const found = await pool(jobs, 10, async (job) => {
    for (const src of job.sources) {
      const img = await imageFor(src.url);
      if (img) return { slot: job.slot, src: img, credit: src.name };
    }
    return null;
  });
  // The same image on two different stories is a site-wide default, not a story photo.
  const counts = {};
  for (const f of found) if (f) counts[f.src] = (counts[f.src] || 0) + 1;
  const map = {};
  for (const f of found) if (f && counts[f.src] === 1) map[f.slot] = { src: f.src, credit: f.credit };
  return map;
}

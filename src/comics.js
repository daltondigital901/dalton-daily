// The funnies. xkcd (CC BY-NC 2.5) via its JSON API; SMBC and Existential Comics via their
// publishers' own RSS feeds, displayed with attribution and a link back, the way a feed reader does.

const UA = { "user-agent": "DaltonDaily/1.0 (personal newspaper; feed reader)" };

function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function items(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const item = m[1];
    const tag = (t) => {
      const r = item.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
      return r ? decode(r[1]) : "";
    };
    return { title: tag("title"), link: tag("link"), description: tag("description"), content: tag("content:encoded"), pubDate: tag("pubDate") };
  });
}

// Normalise a strip's link so the same comic matches across editions (http/https, trailing slash).
export function comicKey(link = "") {
  return String(link).replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "").toLowerCase();
}

// A stable pseudo-random sequence per date, so a re-run of the same morning picks the same classics.
function seq(seed, max, n) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    out.push(1 + ((h >>> 0) % max));
  }
  return out;
}

async function text(url) {
  const r = await fetch(url, { headers: UA, redirect: "follow" });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return { body: await r.text(), url: r.url || url };
}

// xkcd: today's strip if it has not run yet, otherwise a classic from the archive.
async function xkcd(seen, seed) {
  const pack = (j) => ({
    key: "xkcd", strip: "xkcd", author: "Randall Munroe",
    title: j.safe_title || j.title, images: [j.img], caption: j.alt,
    link: `https://xkcd.com/${j.num}/`, date: `${j.year}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(2, "0")}`,
    license: "CC BY-NC 2.5",
  });
  const latest = await (await fetch("https://xkcd.com/info.0.json", { headers: UA })).json();
  if (!seen.has(comicKey(`https://xkcd.com/${latest.num}/`))) return pack(latest);
  for (const n of seq(seed + "xkcd", latest.num - 1, 12)) {
    if (n === 404 || seen.has(comicKey(`https://xkcd.com/${n}/`))) continue;
    const r = await fetch(`https://xkcd.com/${n}/info.0.json`, { headers: UA });
    if (!r.ok) continue;
    const j = await r.json();
    if (j.img && !/\/comics\/$/.test(j.img)) return { ...pack(j), classic: true };
  }
  return null;
}

// SMBC: newest unseen strip in the feed, otherwise a random strip from the archive.
function smbcFrom(it) {
  const img = it.description.match(/<img[^>]+src="([^"]+)"/);
  const hover = it.description.match(/Hovertext:<br\/>([\s\S]*?)<\/p>/);
  return {
    key: "smbc", strip: "Saturday Morning Breakfast Cereal", author: "Zach Weinersmith",
    title: it.title.replace(/^Saturday Morning Breakfast Cereal - /, ""),
    images: img ? [img[1]] : [], caption: hover ? decode(hover[1]) : "",
    link: it.link, date: it.pubDate,
  };
}
async function smbc(seen) {
  const { body } = await text("https://www.smbc-comics.com/comic/rss");
  const fresh = items(body).find((it) => it.link && !seen.has(comicKey(it.link)));
  if (fresh) return smbcFrom(fresh);
  for (let i = 0; i < 4; i++) {
    const { body: page, url } = await text("https://www.smbc-comics.com/random.php");
    const img = page.match(/<img[^>]+id="cc-comic"[^>]*>/);
    const src = img && img[0].match(/src="([^"]+)"/);
    const link = (page.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/) || [])[1] || url;
    if (!src || seen.has(comicKey(link))) continue;
    const title = decode((page.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").replace(/^Saturday Morning Breakfast Cereal - /, "");
    const hover = img[0].match(/title="([^"]*)"/);
    return {
      key: "smbc", strip: "Saturday Morning Breakfast Cereal", author: "Zach Weinersmith",
      title, images: [new URL(src[1], "https://www.smbc-comics.com/").href], caption: hover ? decode(hover[1]) : "",
      link, classic: true,
    };
  }
  return null;
}

// Poorly Drawn Lines (Reza Farazmand): light, dry and smart. Newest unseen post in the WordPress
// feed, paging back through older feed pages when every recent strip has already run.
async function pdl(seen) {
  for (let page = 1; page <= 6; page++) {
    let body;
    try { ({ body } = await text(`https://poorlydrawnlines.com/feed/${page > 1 ? `?paged=${page}` : ""}`)); } catch { break; }
    for (const it of items(body)) {
      if (!it.link || seen.has(comicKey(it.link))) continue;
      const html = it.content + it.description;
      const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((x) => x[1]).filter((u) => !/emoji|gravatar|feeds\.|pixel|1x1/i.test(u));
      let img = imgs.find((u) => /uploads/i.test(u)) || imgs[0];
      if (!img) {
        const p = (await text(it.link)).body;
        const og = p.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        img = og ? decode(og[1]) : null;
      }
      if (!img) continue;
      return { key: "pdl", strip: "Poorly Drawn Lines", author: "Reza Farazmand", title: it.title, images: [img], caption: "", link: it.link, date: it.pubDate, classic: page > 1 || undefined };
    }
  }
  return null;
}

// Existential Comics: newest unseen strip in the feed, otherwise a numbered strip from the archive.
async function existential(seen, seed) {
  const { body } = await text("https://existentialcomics.com/rss.xml");
  const feed = items(body);
  const fromFeed = (it) => {
    const images = [...it.description.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    const titles = [...it.description.matchAll(/title="([^"]*)"/g)].map((m) => decode(m[1])).filter((t) => t && t !== "None");
    return {
      key: "existential", strip: "Existential Comics", author: "Corey Mohler",
      title: it.title, images, caption: titles.pop() || "",
      link: it.link.replace(/^http:/, "https:"), date: it.pubDate,
    };
  };
  const fresh = feed.find((it) => it.link && !seen.has(comicKey(it.link)));
  if (fresh) return fromFeed(fresh);
  const latest = Math.max(0, ...feed.map((it) => Number((it.link.match(/comic\/(\d+)/) || [])[1]) || 0));
  if (!latest) return null;
  for (const n of seq(seed + "ec", latest - 1, 8)) {
    const link = `https://existentialcomics.com/comic/${n}`;
    if (seen.has(comicKey(link))) continue;
    let page;
    try { page = (await text(link)).body; } catch { continue; }
    const tags = [...page.matchAll(/<img[^>]+class="comicImg"[^>]*>/g)].map((m) => m[0]);
    const images = tags.map((t) => (t.match(/src="([^"]+)"/) || [])[1]).filter(Boolean).map((u) => new URL(u, link).href);
    if (!images.length) continue;
    const captions = tags.map((t) => decode((t.match(/title="([^"]*)"/) || [])[1] || "")).filter((t) => t && t !== "None");
    const title = decode((page.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || page.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "")
      .replace(/<[^>]+>/g, "").replace(/^Existential Comics\s*-\s*/, "").trim();
    return { key: "existential", strip: "Existential Comics", author: "Corey Mohler", title, images, caption: captions.pop() || "", link, classic: true };
  }
  return null;
}

// seen: links of strips already printed in earlier editions; nothing runs twice.
export async function fetchComics(seen = new Set(), seed = "") {
  const jobs = [xkcd(seen, seed), pdl(seen), smbc(seen), existential(seen, seed)];
  const out = [];
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "fulfilled" && r.value) out.push(r.value);
  }
  return out;
}

// Links of every strip printed before `date`.
export async function seenComics(db, date) {
  const { results } = await db
    .prepare("SELECT json_extract(j.value, '$.link') AS link FROM editions e, json_each(e.data, '$.comics') j WHERE e.date < ?")
    .bind(date).all();
  return new Set((results || []).map((r) => comicKey(r.link)).filter(Boolean));
}

export async function fetchWeather() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const w = await fetchWeatherOnce();
    if (w) return w;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

async function fetchWeatherOnce() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=35.1495&longitude=-90.0490" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code" +
      "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=1";
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const j = await res.json();
    const code = j.daily.weather_code[0];
    return {
      high: Math.round(j.daily.temperature_2m_max[0]),
      low: Math.round(j.daily.temperature_2m_min[0]),
      rain: j.daily.precipitation_probability_max[0],
      sky: weatherWord(code),
    };
  } catch {
    return null;
  }
}

function weatherWord(c) {
  if (c === 0) return "Clear";
  if (c <= 2) return "Partly cloudy";
  if (c === 3) return "Overcast";
  if (c <= 48) return "Fog";
  if (c <= 57) return "Drizzle";
  if (c <= 67) return "Rain";
  if (c <= 77) return "Snow";
  if (c <= 82) return "Showers";
  if (c <= 86) return "Snow showers";
  return "Thunderstorms";
}

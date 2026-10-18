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

function firstItem(xml) {
  const m = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!m) return null;
  const item = m[1];
  const tag = (t) => {
    const r = item.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
    return r ? decode(r[1]) : "";
  };
  return { title: tag("title"), link: tag("link"), description: tag("description"), pubDate: tag("pubDate") };
}

async function xkcd() {
  const r = await fetch("https://xkcd.com/info.0.json", { headers: UA });
  const j = await r.json();
  return {
    key: "xkcd", strip: "xkcd", author: "Randall Munroe",
    title: j.safe_title || j.title, images: [j.img], caption: j.alt,
    link: `https://xkcd.com/${j.num}/`, date: `${j.year}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(2, "0")}`,
    license: "CC BY-NC 2.5",
  };
}

async function smbc() {
  const r = await fetch("https://www.smbc-comics.com/comic/rss", { headers: UA });
  const it = firstItem(await r.text());
  const img = it.description.match(/<img[^>]+src="([^"]+)"/);
  const hover = it.description.match(/Hovertext:<br\/>([\s\S]*?)<\/p>/);
  return {
    key: "smbc", strip: "Saturday Morning Breakfast Cereal", author: "Zach Weinersmith",
    title: it.title.replace(/^Saturday Morning Breakfast Cereal - /, ""),
    images: img ? [img[1]] : [], caption: hover ? decode(hover[1]) : "",
    link: it.link, date: it.pubDate,
  };
}

// Poorly Drawn Lines (Reza Farazmand): light, dry and smart. WordPress feed; the strip is the first
// large image in the post. Falls back to the post page's share image.
async function pdl() {
  const r = await fetch("https://poorlydrawnlines.com/feed/", { headers: UA });
  const xml = await r.text();
  const m = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!m) return null;
  const item = m[1];
  const tag = (t) => {
    const x = item.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
    return x ? decode(x[1]) : "";
  };
  const title = tag("title");
  const link = tag("link");
  const html = tag("content:encoded") + tag("description");
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((x) => x[1]).filter((u) => !/emoji|gravatar|feeds\.|pixel|1x1/i.test(u));
  let img = imgs.find((u) => /uploads/i.test(u)) || imgs[0];
  if (!img && link) {
    const page = await (await fetch(link, { headers: UA })).text();
    const og = page.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    img = og ? decode(og[1]) : null;
  }
  if (!img) return null;
  return { key: "pdl", strip: "Poorly Drawn Lines", author: "Reza Farazmand", title, images: [img], caption: "", link, date: tag("pubDate") };
}

async function existential() {
  const r = await fetch("https://existentialcomics.com/rss.xml", { headers: UA });
  const it = firstItem(await r.text());
  const images = [...it.description.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const titles = [...it.description.matchAll(/title="([^"]*)"/g)].map((m) => decode(m[1])).filter((t) => t && t !== "None");
  return {
    key: "existential", strip: "Existential Comics", author: "Corey Mohler",
    title: it.title, images, caption: titles.pop() || "",
    link: it.link.replace(/^http:/, "https:"), date: it.pubDate,
  };
}

export async function fetchComics() {
  const jobs = [xkcd(), pdl(), smbc(), existential()];
  const out = [];
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "fulfilled" && r.value) out.push(r.value);
  }
  return out;
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

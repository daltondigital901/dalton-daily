import { renderEdition, renderArchive, renderMessage, PAGES } from "./render.js";
import { SECTIONS } from "./sections.js";
import { ICONS } from "./icons.js";

function b64(b) {
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const ICON_ROUTES = {
  "/favicon.ico": ["ico", "image/x-icon"],
  "/apple-touch-icon.png": ["p180", "image/png"],
  "/apple-touch-icon-precomposed.png": ["p180", "image/png"],
  "/icon-192.png": ["p192", "image/png"],
  "/icon-512.png": ["p512", "image/png"],
};

export { EditionWorkflow } from "./workflow.js";

function localParts(tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

async function startEdition(env, date) {
  const instance = await env.EDITION.create({ id: `ed-${date}-${Date.now()}`, params: { date } });
  return instance.id;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

async function latestEdition(env, date) {
  const row = date
    ? await env.DB.prepare("SELECT data FROM editions WHERE date = ? AND status = 'complete'").bind(date).first()
    : await env.DB.prepare("SELECT data FROM editions WHERE status = 'complete' ORDER BY date DESC LIMIT 1").first();
  return row ? JSON.parse(row.data) : null;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { date: today } = localParts(env.TIMEZONE || "America/Chicago");

    if (url.pathname === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n");
    if (ICON_ROUTES[url.pathname]) {
      const [key, type] = ICON_ROUTES[url.pathname];
      return new Response(b64(ICONS[key]), { headers: { "content-type": type, "cache-control": "public, max-age=604800" } });
    }
    if (url.pathname === "/manifest.webmanifest") {
      return Response.json({
        name: "Dalton Daily", short_name: "Dalton Daily", start_url: "/", display: "standalone",
        background_color: "#f6f2e8", theme_color: "#17140f",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
      }, { headers: { "content-type": "application/manifest+json" } });
    }

    if (url.pathname === "/api/vote" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      const vote = Number(body?.vote);
      if (!body?.id || ![1, -1].includes(vote) || !SECTIONS.some((s) => s.key === body.section)) {
        return new Response("bad request", { status: 400 });
      }
      await env.DB.batch([
        env.DB.prepare("DELETE FROM feedback WHERE story_id = ?").bind(String(body.id)),
        env.DB.prepare("INSERT INTO feedback (story_id, section, vote, created_at) VALUES (?, ?, ?, datetime('now'))")
          .bind(String(body.id), body.section, vote),
      ]);
      return Response.json({ ok: true });
    }

    if (url.pathname === "/admin/run") {
      // No login, so guard the spend: at most one print every 20 minutes.
      const recent = await env.DB.prepare("SELECT 1 FROM runs WHERE started_at >= datetime('now', '-20 minutes')").first();
      if (recent) {
        return html(renderMessage("Reprint", `The presses already ran in the last 20 minutes. <a href="/admin/status">Check status</a>`), 429);
      }
      const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") || "") ? url.searchParams.get("date") : today;
      const id = await startEdition(env, date);
      return html(renderMessage("Reprint", `The presses are running for ${date}. The edition usually lands in 5&ndash;10 minutes. <a href="/admin/status">Check status</a> &middot; instance <code>${id}</code>`));
    }

    if (url.pathname === "/admin/status") {
      const rows = await env.DB.prepare("SELECT date, started_at, finished_at, status, detail FROM runs ORDER BY id DESC LIMIT 15").all();
      const list = rows.results
        .map((r) => `<li><b>${r.date}</b> &middot; ${r.status} &middot; started ${r.started_at} UTC${r.finished_at ? ` &middot; finished ${r.finished_at}` : ""}<br><small>${(r.detail || "").replace(/</g, "&lt;")}</small></li>`)
        .join("");
      return html(renderMessage("Press room", `<ul>${list || "<li>No runs yet.</li>"}</ul><p><a href="/admin/run">Print today's edition now</a> &middot; <a href="/">Back to the paper</a></p>`));
    }

    if (url.pathname === "/archive") {
      const rows = await env.DB.prepare("SELECT date FROM editions WHERE status = 'complete' ORDER BY date DESC LIMIT 400").all();
      return html(renderArchive(rows.results));
    }

    // Pages: /, /<page>, /<date>, /<date>/<page>
    const m = url.pathname.match(/^\/(?:(\d{4}-\d{2}-\d{2})\/?)?([a-z-]*)\/?$/);
    if (m && (!m[2] || PAGES.includes(m[2]))) {
      const [, date, page] = m;
      const ed = await latestEdition(env, date);
      if (!ed) {
        return date
          ? html(renderMessage("Not found", `No edition for ${date}. <a href="/archive">Archive</a>`), 404)
          : html(renderMessage("First edition", `No edition has been printed yet. <a href="/admin/run">Print the first edition now</a>.`));
      }
      const notice = !date && ed.date !== today ? `This is the ${ed.longDate} edition. Today's paper is not out yet.` : "";
      return html(renderEdition(ed, { notice, page: page || "home", base: date ? `/${date}` : "" }));
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    const { date, hour } = localParts(env.TIMEZONE || "America/Chicago");
    if (hour !== Number(env.EDITION_HOUR || 2)) return; // the other UTC slots (DST) do nothing
    const exists = await env.DB.prepare("SELECT 1 FROM editions WHERE date = ? AND status = 'complete'").bind(date).first();
    if (exists) return;
    // Backup slot: skip if an attempt is still running from the last 25 minutes.
    const running = await env.DB.prepare(
      "SELECT 1 FROM runs WHERE date = ? AND status = 'running' AND started_at >= datetime('now', '-25 minutes')"
    ).bind(date).first();
    if (running) return;
    ctx.waitUntil(startEdition(env, date));
  },
};

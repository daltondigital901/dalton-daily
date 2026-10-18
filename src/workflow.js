// One Workflow instance = one edition. Each section is its own durable step with retries,
// so a slow or failed beat never sinks the whole paper.
import { WorkflowEntrypoint } from "cloudflare:workers";
import { SECTIONS } from "./sections.js";
import { reportSection } from "./claude.js";
import { fetchComics, fetchWeather } from "./comics.js";
import { writeScripture, writeSlaaReading, writeStoic } from "./devotions.js";
import { findImages } from "./images.js";

const BATCH = 6; // sections reported in parallel

export function longDate(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

async function storyId(date, section, i, headline) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`${date}|${section}|${i}|${headline}`));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class EditionWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const date = event.payload.date;
    const env = this.env;

    const ctx = await step.do("load context", async () => {
      const recentRows = await env.DB.prepare(
        "SELECT section, headline, date FROM stories WHERE date >= date(?, '-45 days') AND date < ? ORDER BY date DESC"
      ).bind(date, date).all();
      const lookback = Object.fromEntries(SECTIONS.map((s) => [s.key, s.lookback || 3]));
      const dayMs = 86400000, today = Date.parse(date + "T00:00:00Z");
      const voteRows = await env.DB.prepare(
        `SELECT f.section, f.vote, s.headline FROM feedback f JOIN stories s ON s.id = f.story_id
         WHERE f.created_at >= datetime('now', '-60 days') ORDER BY f.created_at DESC LIMIT 400`
      ).all();
      const recentHeadlines = {}, liked = {}, disliked = {};
      for (const r of recentRows.results) {
        if ((today - Date.parse(r.date + "T00:00:00Z")) / dayMs <= (lookback[r.section] || 3)) {
          (recentHeadlines[r.section] ||= []).push(r.headline);
        }
      }
      for (const r of voteRows.results) {
        const bucket = r.vote > 0 ? liked : disliked;
        const list = (bucket[r.section] ||= []);
        if (list.length < 12) list.push(r.headline);
      }
      const dev = await env.DB.prepare(
        "SELECT kind, ref FROM devotions WHERE date >= date(?, '-365 days') AND date < ? ORDER BY date DESC"
      ).bind(date, date).all();
      const recentScripture = dev.results.filter((r) => r.kind === "scripture").map((r) => r.ref).slice(0, 90);
      const recentSlaa = dev.results.filter((r) => r.kind === "slaa").map((r) => r.ref).slice(0, 14);
      const recentStoic = dev.results.filter((r) => r.kind === "stoic").map((r) => r.ref).slice(0, 120);
      const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM editions WHERE status = 'complete' AND date < ?").bind(date).first();
      await env.DB.prepare("INSERT INTO runs (date, started_at, status) VALUES (?, datetime('now'), 'running')").bind(date).run();
      return { recentHeadlines, liked, disliked, recentScripture, recentSlaa, recentStoic, longDate: longDate(date), number: (n?.n || 0) + 1 };
    });

    const sections = {};
    const errors = {};
    let searches = 0;
    for (let i = 0; i < SECTIONS.length; i += BATCH) {
      const batch = SECTIONS.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (section) => {
          try {
            const r = await step.do(
              `section ${section.key}`,
              { retries: { limit: 2, delay: "20 seconds", backoff: "exponential" }, timeout: "8 minutes" },
              () => reportSection(env, section, ctx)
            );
            return [section.key, r, null];
          } catch (e) {
            return [section.key, null, String(e?.message || e).slice(0, 400)];
          }
        })
      );
      for (const [key, r, err] of results) {
        if (r) { sections[key] = r.stories; searches += r.searches; }
        else errors[key] = err;
      }
    }

    const images = await step.do("images", { retries: { limit: 1, delay: "10 seconds" }, timeout: "6 minutes" }, () =>
      findImages(sections)
    ).catch(() => ({}));

    const retry = { retries: { limit: 2, delay: "20 seconds", backoff: "exponential" }, timeout: "5 minutes" };
    const [scripture, slaa, stoic] = await Promise.all([
      step.do("scripture", retry, () => writeScripture(env, ctx)).catch((e) => { errors.scripture = String(e?.message || e).slice(0, 400); return null; }),
      step.do("slaa reading", retry, () => writeSlaaReading(env, ctx, date)).catch((e) => { errors.slaa = String(e?.message || e).slice(0, 400); return null; }),
      step.do("stoic reading", retry, () => writeStoic(env, ctx, date)).catch((e) => { errors.stoic = String(e?.message || e).slice(0, 400); return null; }),
    ]);

    const extras = await step.do("comics and weather", async () => ({
      comics: await fetchComics(),
      weather: await fetchWeather(),
    }));

    return await step.do("publish", async () => {
      const ids = [];
      for (const [key, stories] of Object.entries(sections)) {
        for (let i = 0; i < stories.length; i++) {
          stories[i].id = await storyId(date, key, i, stories[i].headline);
          stories[i].section = key;
          const img = images[`${key}:${i}`];
          if (img) stories[i].image = img;
          ids.push(stories[i]);
        }
      }
      // Front page: the most important stories, at most one per section.
      // The lead should carry a picture: promote the best illustrated story if it is within a point of the top.
      const seen = new Set();
      const ranked = ids.slice().sort((a, b) => b.importance - a.importance);
      const frontStories = ranked.filter((s) => (seen.has(s.section) ? false : seen.add(s.section))).slice(0, 5);
      const illustrated = frontStories.find((s) => s.image);
      if (illustrated && frontStories[0] !== illustrated && illustrated.importance >= frontStories[0].importance - 1) {
        frontStories.splice(frontStories.indexOf(illustrated), 1);
        frontStories.unshift(illustrated);
      }
      const front = frontStories.map((s) => s.id);
      // "In Pictures": four more illustrated stories from different desks, not already on the front page.
      const deskOf = Object.fromEntries(SECTIONS.map((s) => [s.key, s.desk]));
      const usedDesks = new Set();
      const pictures = ranked
        .filter((s) => s.image && !front.includes(s.id))
        .filter((s) => (usedDesks.has(deskOf[s.section]) ? false : usedDesks.add(deskOf[s.section])))
        .slice(0, 4)
        .map((s) => s.id);

      const edition = {
        date, longDate: ctx.longDate, number: ctx.number,
        weather: extras.weather, comics: extras.comics,
        devotions: { scripture, stoic, slaa },
        sections, front, pictures, errors, searches,
        generatedAt: new Date().toISOString(),
      };

      const stmts = [
        env.DB.prepare(
          "INSERT INTO editions (date, created_at, status, data) VALUES (?, datetime('now'), 'complete', ?) " +
          "ON CONFLICT(date) DO UPDATE SET created_at = excluded.created_at, status = excluded.status, data = excluded.data"
        ).bind(date, JSON.stringify(edition)),
        env.DB.prepare("DELETE FROM stories WHERE date = ?").bind(date),
        env.DB.prepare("DELETE FROM devotions WHERE date = ?").bind(date),
        ...(scripture ? [env.DB.prepare("INSERT INTO devotions (date, kind, ref) VALUES (?, 'scripture', ?)").bind(date, scripture.reference)] : []),
        ...(slaa ? [env.DB.prepare("INSERT INTO devotions (date, kind, ref) VALUES (?, 'slaa', ?)").bind(date, `${slaa.title} (${slaa.source})`)] : []),
        ...(stoic ? [env.DB.prepare("INSERT INTO devotions (date, kind, ref) VALUES (?, 'stoic', ?)").bind(date, `${stoic.author}, ${stoic.work} ${stoic.citation}`)] : []),
        ...ids.map((s) =>
          env.DB.prepare("INSERT OR REPLACE INTO stories (id, date, section, headline, url) VALUES (?, ?, ?, ?, ?)")
            .bind(s.id, date, s.section, s.headline, s.sources[0]?.url || null)
        ),
        env.DB.prepare(
          "UPDATE runs SET finished_at = datetime('now'), status = ?, detail = ? WHERE id = (SELECT MAX(id) FROM runs WHERE date = ?)"
        ).bind(
          Object.keys(errors).length ? "partial" : "ok",
          JSON.stringify({ stories: ids.length, images: ids.filter((s) => s.image).length, searches, errors }),
          date
        ),
      ];
      await env.DB.batch(stmts);
      return { date, stories: ids.length, searches, failed: Object.keys(errors) };
    });
  }
}

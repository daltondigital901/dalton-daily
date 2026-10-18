// One Workflow instance = one edition. Each section is its own durable step with retries,
// so a slow or failed beat never sinks the whole paper.
import { WorkflowEntrypoint } from "cloudflare:workers";
import { SECTIONS } from "./sections.js";
import { reportSection, sectionRequest, finishSection } from "./claude.js";
import { submitBatch, getBatch, cancelBatch, batchResults } from "./batch.js";
import { fetchComics, fetchWeather } from "./comics.js";
import { writeScripture, writeStoic, writeCommonplace, stoicRequest, finishStoic, commonplaceRequest, finishCommonplace } from "./devotions.js";
import { findImages } from "./images.js";
import { pingIndexNow } from "./indexnow.js";
import { PAGES, SITE } from "./render.js";

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
      const recentCommonplace = dev.results.filter((r) => r.kind === "commonplace").map((r) => r.ref).slice(0, 200);
      const recentStoic = dev.results.filter((r) => r.kind === "stoic").map((r) => r.ref).slice(0, 120);
      const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM editions WHERE status = 'complete' AND date < ?").bind(date).first();
      await env.DB.prepare("INSERT INTO runs (date, started_at, status) VALUES (?, datetime('now'), 'running')").bind(date).run();
      return { recentHeadlines, liked, disliked, recentScripture, recentCommonplace, recentStoic, longDate: longDate(date), number: (n?.n || 0) + 1 };
    });

    const sections = {};
    const errors = {};
    let searches = 0;
    const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    const batchTokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    const addUsage = (u, into = tokens) => { if (!u) return; for (const k of Object.keys(into)) into[k] += u[k] || 0; };
    const fromBatch = (o) => ({ ...o, citedUrls: new Map(Object.entries(o.citedUrls || {})) });
    let stoic = null, commonplace = null;

    // 1) Overnight runs go through the Batch API first (half the token price).
    let batched = {};
    if (event.payload.batch) {
      try {
        const sub = await step.do("batch submit", { retries: { limit: 2, delay: "30 seconds" } }, async () => {
          const items = [
            ...SECTIONS.map((sec) => ({ id: `section-${sec.key}`, req: sectionRequest(env, sec, ctx) })),
            { id: "stoic", req: stoicRequest(env, ctx, date) },
            { id: "commonplace", req: commonplaceRequest(env, ctx, date) },
          ];
          return { id: await submitBatch(env, items), deadline: Date.now() + (event.payload.batchMinutes || 135) * 60000 };
        });
        for (let n = 0; n < 200; n++) {
          const st = await step.do(`batch poll ${n}`, async () => {
            const b = await getBatch(env, sub.id);
            return { status: b.processing_status, now: Date.now() };
          });
          if (st.status === "ended" || st.now > sub.deadline) break;
          await step.sleep(`batch wait ${n}`, "90 seconds");
        }
        batched = await step.do("batch results", { retries: { limit: 2, delay: "20 seconds" }, timeout: "5 minutes" }, async () => {
          let b = await getBatch(env, sub.id);
          if (b.processing_status !== "ended") {
            await cancelBatch(env, sub.id);
            for (let i = 0; i < 12 && b.processing_status !== "ended"; i++) {
              await new Promise((r) => setTimeout(r, 5000));
              b = await getBatch(env, sub.id);
            }
          }
          return b.processing_status === "ended" && b.results_url ? await batchResults(env, b.results_url) : {};
        });
      } catch (e) {
        errors.batch = String(e?.message || e).slice(0, 300);
        batched = {};
      }
    }
    for (const sec of SECTIONS) {
      const o = batched[`section-${sec.key}`];
      if (!o) continue;
      try {
        const r = finishSection(sec, fromBatch(o));
        sections[sec.key] = r.stories; searches += r.searches; addUsage(r.usage, batchTokens);
      } catch {}
    }
    if (batched.stoic) { try { stoic = finishStoic(date, fromBatch(batched.stoic)); } catch {} }
    if (batched.commonplace) { try { commonplace = finishCommonplace(date, fromBatch(batched.commonplace)); } catch {} }
    for (const d of [stoic, commonplace]) {
      if (d?._usage) { addUsage(d._usage, batchTokens); searches += d._usage.searches || 0; delete d._usage; }
    }

    // 2) Everything else (all of it on a live run) is reported live, six sections at a time.
    const todo = SECTIONS.filter((sec) => !sections[sec.key]);
    for (let i = 0; i < todo.length; i += BATCH) {
      const group = todo.slice(i, i + BATCH);
      const results = await Promise.all(
        group.map(async (section) => {
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
        if (r) { sections[key] = r.stories; searches += r.searches; addUsage(r.usage); }
        else errors[key] = err;
      }
    }

    const images = await step.do("images", { retries: { limit: 1, delay: "10 seconds" }, timeout: "6 minutes" }, () =>
      findImages(sections, Object.fromEntries(SECTIONS.map((s) => [s.key, s.photo || s.name])))
    ).catch(() => ({}));

    const retry = { retries: { limit: 2, delay: "20 seconds", backoff: "exponential" }, timeout: "5 minutes" };
    const [scripture, cpLive, stLive] = await Promise.all([
      step.do("scripture", retry, () => writeScripture(env, ctx)).catch((e) => { errors.scripture = String(e?.message || e).slice(0, 400); return null; }),
      commonplace ? null : step.do("commonplace", retry, () => writeCommonplace(env, ctx, date)).catch((e) => { errors.commonplace = String(e?.message || e).slice(0, 400); return null; }),
      stoic ? null : step.do("stoic reading", retry, () => writeStoic(env, ctx, date)).catch((e) => { errors.stoic = String(e?.message || e).slice(0, 400); return null; }),
    ]);
    commonplace = commonplace || cpLive;
    stoic = stoic || stLive;

    for (const d of [scripture, commonplace, stoic]) {
      if (d?._usage) { addUsage(d._usage); searches += d._usage.searches || 0; delete d._usage; }
    }
    // Claude Sonnet 5.5: $2/M input, $10/M output; cache writes 1.25x and reads 0.05x of input;
    // Batch API halves token prices; web search $10 per 1,000 either way.
    const tokCost = (t) => t.input * 2e-6 + t.output * 1e-5 + t.cacheRead * 1e-7 + t.cacheWrite * 2.5e-6;
    const cost = +(searches * 0.01 + tokCost(tokens) + tokCost(batchTokens) / 2).toFixed(2);
    const batchedCount = SECTIONS.filter((sec) => batched[`section-${sec.key}`]).length;

    const extras = await step.do("comics and weather", async () => ({
      comics: await fetchComics(),
      weather: await fetchWeather(),
    }));

    const published = await step.do("publish", async () => {
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
        devotions: { scripture, stoic, commonplace },
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
        ...(commonplace ? [env.DB.prepare("INSERT INTO devotions (date, kind, ref) VALUES (?, 'commonplace', ?)").bind(date, `${commonplace.field}: ${commonplace.title}`)] : []),
        ...(stoic ? [env.DB.prepare("INSERT INTO devotions (date, kind, ref) VALUES (?, 'stoic', ?)").bind(date, `${stoic.author}, ${stoic.work} ${stoic.citation}`)] : []),
        ...ids.map((s) =>
          env.DB.prepare("INSERT OR REPLACE INTO stories (id, date, section, headline, url) VALUES (?, ?, ?, ?, ?)")
            .bind(s.id, date, s.section, s.headline, s.sources[0]?.url || null)
        ),
        env.DB.prepare(
          "UPDATE runs SET finished_at = datetime('now'), status = ?, detail = ? WHERE id = (SELECT MAX(id) FROM runs WHERE date = ?)"
        ).bind(
          Object.keys(errors).length ? "partial" : "ok",
          JSON.stringify({ stories: ids.length, images: ids.filter((s) => s.image).length, searches, tokens, batchTokens, batched: batchedCount, cost, errors }),
          date
        ),
      ];
      await env.DB.batch(stmts);
      return { date, stories: ids.length, searches, failed: Object.keys(errors) };
    });

    // Tell search engines the new edition is up (best effort).
    await step.do("indexnow", async () => {
      try { await pingIndexNow(SITE, ["/", ...PAGES.map((p) => `/${p}`), `/${date}`]); } catch {}
      return true;
    });
    return published;
  }
}

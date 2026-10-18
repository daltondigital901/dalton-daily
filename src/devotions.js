// Morning Reflections: a daily scripture and a daily SLAA reading.
//
// Scripture: Claude picks the passage and writes a short reflection; the verse text itself comes
// verbatim from bible-api.com (World English Bible, public domain) so it is never misquoted.
//
// SLAA: Claude searches only slaafws.org (the Augustine Fellowship's own site and store) and writes
// a reading in its own words, citing and linking the SLAA document it draws on. SLAA literature is
// copyrighted, so the reading paraphrases and links rather than reprinting.
import { callClaude, extractJson } from "./claude.js";

const TRANSLATION = "web";

// Most days focus on limerence and romantic obsession; the rest rotate through other recovery themes.
const SLAA_ROTATION = [
  "the Twelve Steps as SLAA works them",
  "the Twelve Traditions and fellowship",
  "bottom lines, top lines and boundaries",
  "sponsorship, service and outreach calls",
  "withdrawal and the first weeks of sobriety",
  "anorexia (sexual, social and emotional) as SLAA describes it",
  "the Signs of Recovery",
  "healthy intimacy and dating in recovery",
];

export function slaaFocus(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  const day = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  if (day % 10 < 7) return { limerence: true, theme: "limerence, romantic obsession, fantasy and intrigue, and recovery from them" };
  return { limerence: false, theme: SLAA_ROTATION[day % SLAA_ROTATION.length] };
}

export async function writeScripture(env, ctx) {
  const recent = ctx.recentScripture || [];
  const system =
    `You choose the daily scripture for a private morning newspaper. Today is ${ctx.longDate}. ` +
    "Return ONLY JSON wrapped in <json></json>.";
  const prompt = [
    "Pick one passage of 3 to 10 consecutive verses from the Bible (Old or New Testament) for today's reading.",
    "Vary across books and genres over time: Psalms, Proverbs, the Gospels, the Epistles, the Prophets, narrative.",
    "Favor passages that speak to steadiness, honesty, surrender, love rightly ordered, and daily discipline, but do not force a theme.",
    recent.length ? `Do NOT use any of these recent passages:\n- ${recent.join("\n- ")}` : "",
    'JSON shape: <json>{"reference":"Psalm 46:1-7","query":"psalm 46:1-7","theme":"Two to five words","reflection":"Three or four sentences of plain, non-preachy reflection on the passage, in your own words. Do not quote the passage."}</json>',
    '"query" must be the reference in a form bible-api.com accepts: lowercase book name, chapter:verse-verse.',
  ].filter(Boolean).join("\n\n");

  const { text } = await callClaude(env, { system, prompt, maxTokens: 1200 });
  const pick = extractJson(text);
  let verses = [];
  let reference = pick.reference;
  try {
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(pick.query)}?translation=${TRANSLATION}`);
    if (r.ok) {
      const j = await r.json();
      reference = j.reference || reference;
      verses = (j.verses || []).map((v) => ({ n: v.verse, text: String(v.text).replace(/\s+/g, " ").trim() }));
    }
  } catch {}
  return {
    reference,
    theme: String(pick.theme || ""),
    reflection: String(pick.reflection || ""),
    verses,
    translation: "World English Bible",
    link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=WEB`,
  };
}

export async function writeSlaaReading(env, ctx, dateIso) {
  const focus = slaaFocus(dateIso);
  const recent = ctx.recentSlaa || [];
  const system = [
    `You write the daily recovery reading for a private morning newspaper. Today is ${ctx.longDate}.`,
    "The reader is a member of Sex and Love Addicts Anonymous (SLAA). Write with warmth and plain honesty, the way a",
    "thoughtful sponsor would talk: no clinical lecturing, no shaming, no grandiosity.",
    "Rules:",
    "- Draw ONLY on SLAA's own literature and documents found by searching slaafws.org.",
    "- SLAA literature is copyrighted. Write the reading entirely in your own words. Never reproduce sentences or",
    "  passages. At most one short quoted phrase under 12 words, clearly attributed.",
    "- Name the specific SLAA document you drew on and give its URL from your search results.",
    "- Do not give medical or clinical advice. Do not diagnose.",
    "- Return ONLY JSON wrapped in <json></json>.",
  ].join("\n");
  const prompt = [
    `Today's focus: ${focus.theme}.`,
    focus.limerence
      ? "Ground it in what SLAA's literature says about romantic obsession and limerence: fantasy, intrigue, withdrawal from an obsession, and what recovery looks like day to day."
      : "Ground it in what SLAA's literature says about this theme.",
    recent.length ? `Recent readings (choose a different angle or document):\n- ${recent.join("\n- ")}` : "",
    'JSON shape: <json>{"title":"Short title for today\'s reading","source":"Name of the SLAA document","url":"https://...slaafws.org/...","reading":"150-220 words in your own words, in two or three short paragraphs separated by a blank line","practice":"One concrete, small thing to practice today","question":"One question for journaling or for a sponsor"}</json>',
  ].filter(Boolean).join("\n\n");

  const { text, citedUrls } = await callClaude(env, {
    system,
    prompt,
    maxTokens: 3000,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4, allowed_domains: ["slaafws.org"] }],
  });
  const r = extractJson(text);
  let url = typeof r.url === "string" && /^https?:\/\/([a-z0-9-]+\.)*slaafws\.org/i.test(r.url) ? r.url : "";
  if (!url) url = [...citedUrls.keys()].find((u) => /slaafws\.org/i.test(u)) || "https://slaafws.org/";
  return {
    title: String(r.title || "Today's reading"),
    source: String(r.source || "SLAA literature"),
    url,
    reading: String(r.reading || ""),
    practice: String(r.practice || ""),
    question: String(r.question || ""),
    limerence: focus.limerence,
  };
}

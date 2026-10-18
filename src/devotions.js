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

// Daily Stoic: alternates between the major Stoics and lesser-known voices and fragments.
// Ancient texts are public domain; translations are quoted only from public-domain editions
// (published before 1929) or rendered fresh from the Greek or Latin and labeled as such.
const STOIC_MAJOR = ["Marcus Aurelius, Meditations", "Seneca, Letters to Lucilius", "Epictetus, Discourses", "Epictetus, Enchiridion", "Seneca, moral essays (On the Shortness of Life, On Anger, On Tranquility of Mind, On Providence, On the Happy Life, On Leisure)", "Musonius Rufus, Lectures and Sayings"];
const STOIC_OBSCURE = [
  "Hierocles, Elements of Ethics and the fragments preserved by Stobaeus (the circles of concern, duties to kin and country)",
  "Cleanthes, Hymn to Zeus and his surviving fragments",
  "Zeno of Citium, fragments and sayings (Diogenes Laertius book 7, Stobaeus)",
  "Chrysippus, fragments (via Plutarch, Galen, Cicero, Aulus Gellius)",
  "Antipater of Tarsus, On Marriage (via Stobaeus)",
  "Panaetius, as preserved in Cicero's De Officiis",
  "Posidonius, fragments (via Seneca, Galen and Strabo)",
  "Cicero, Paradoxa Stoicorum and the Stoic books of the Tusculan Disputations and De Finibus (book 3, Cato's speech)",
  "Seneca's less-read works: Natural Questions, the Consolations to Marcia, Helvia and Polybius, On Benefits, On Clemency",
  "Epictetus, the fragments and the Golden Sayings, and Arrian's preface",
  "Cornutus, Compendium of Greek Theology",
  "Persius, the Stoic Satires (especially 3 and 5)",
  "Aristo of Chios, Herillus, Sphaerus and other early Stoics, via Diogenes Laertius and Stobaeus",
  "Cato the Younger, Thrasea Paetus, Helvidius Priscus and the Stoic opposition, via Plutarch, Tacitus and Epictetus",
  "Marcus Aurelius's teachers: Junius Rusticus, Apollonius of Chalcedon and Sextus of Chaeronea (Meditations book 1, Fronto's letters)",
  "Hecato of Rhodes and Diogenes of Babylon, fragments via Cicero and Seneca",
  "Manilius, Astronomica, and Lucan's Cato in the Pharsalia",
  "Aulus Gellius, Attic Nights, on the Stoics (the Stoic in the storm, 19.1)",
];

export function stoicFocus(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  const day = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  // Roughly 4 days in 7 go to lesser-known Stoics so the reader meets texts he has not seen.
  if (day % 7 < 4) return { obscure: true, pool: STOIC_OBSCURE[(day * 5) % STOIC_OBSCURE.length] };
  return { obscure: false, pool: STOIC_MAJOR[day % STOIC_MAJOR.length] };
}

export async function writeStoic(env, ctx, dateIso) {
  const focus = stoicFocus(dateIso);
  const recent = ctx.recentStoic || [];
  const system = [
    `You choose and introduce the daily Stoic reading for a private morning newspaper. Today is ${ctx.longDate}.`,
    "Rules:",
    "- The passage must be real and exactly cited (author, work, book and section or fragment number). Verify it with your searches before using it. Never invent or blend passages.",
    "- Quote the English only from a public-domain translation published before 1929 (for example George Long, Hastings Crossley, W. A. Oldfather, Richard M. Gummere, John W. Basore, Walter Miller, C. D. Yonge, R. D. Hicks, A. C. Pearson, G. H. Rendall, C. R. Haines) and name the translator and year.",
    "- If no public-domain translation exists, translate it yourself from the Greek or Latin and set translator to \"Translated for Dalton Daily\".",
    "- The passage itself: 40 to 180 words. Keep the translation's wording exactly; you may trim with an ellipsis.",
    "- Return ONLY JSON wrapped in <json></json>.",
  ].join("\n");
  const prompt = [
    `Today's source: ${focus.pool}.`,
    focus.obscure
      ? "Choose something a well-read reader of Marcus Aurelius and Seneca has probably not met: a lesser-known fragment, figure or work. Explain briefly who the author was and how the text survived."
      : "Choose a passage that is not one of the handful everybody quotes; go past the famous lines.",
    recent.length ? `Do NOT reuse any of these recent readings:\n- ${recent.join("\n- ")}` : "",
    'JSON shape: <json>{"author":"Name","work":"Work title","citation":"Book 2, section 4","translator":"Translator, year | Translated for Dalton Daily","url":"https://link to the text (Perseus, Wikisource, LacusCurtius, Project Gutenberg) or blank","passage":"The passage","context":"One or two sentences: who this was and how the text survived","reflection":"Three or four sentences of plain reflection in your own words, connected to ordinary life","practice":"One concrete exercise for today"}</json>',
  ].filter(Boolean).join("\n\n");

  const { text } = await callClaude(env, {
    system,
    prompt,
    maxTokens: 3000,
    tools: [{
      type: "web_search_20250305", name: "web_search", max_uses: 4,
      allowed_domains: ["perseus.tufts.edu", "wikisource.org", "en.wikisource.org", "penelope.uchicago.edu", "gutenberg.org", "thelatinlibrary.com", "sacred-texts.com", "attalus.org", "archive.org", "stoicsource.com", "plato.stanford.edu", "iep.utm.edu"],
    }],
  });
  const r = extractJson(text);
  return {
    author: String(r.author || ""),
    work: String(r.work || ""),
    citation: String(r.citation || ""),
    translator: String(r.translator || ""),
    url: /^https:\/\//.test(r.url || "") ? r.url : "",
    passage: String(r.passage || ""),
    context: String(r.context || ""),
    reflection: String(r.reflection || ""),
    practice: String(r.practice || ""),
    obscure: focus.obscure,
  };
}

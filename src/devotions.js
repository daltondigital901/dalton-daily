// Morning Reflections: a daily scripture, a daily Stoic reading, and the Commonplace Book.
//
// Scripture: Claude picks the passage and writes a short reflection; the verse text itself comes
// verbatim from bible-api.com (World English Bible, public domain) so it is never misquoted.
//
// Commonplace Book: a short, checked essay on one idea, event or figure, rotating through philosophy,
// theology, metaphysics, history, science, literature and entrepreneurship.
import { callClaude, extractJson, scrub } from "./claude.js";

const TRANSLATION = "web";

export async function writeScripture(env, ctx) {
  const recent = ctx.recentScripture || [];
  const system =
    `You choose the daily scripture for Dalton Daily, a morning newspaper. Today is ${ctx.longDate}. ` +
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
    theme: scrub(pick.theme || ""),
    reflection: scrub(pick.reflection || ""),
    verses,
    translation: "World English Bible",
    link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=WEB`,
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
    `You choose and introduce the daily Stoic reading for Dalton Daily, a morning newspaper. Today is ${ctx.longDate}.`,
    "Rules:",
    "- The passage must be real and exactly cited (author, work, book and section or fragment number). Verify it with your searches before using it. Never invent or blend passages.",
    "- Quote the English only from a public-domain translation published before 1929 (for example George Long, Hastings Crossley, W. A. Oldfather, Richard M. Gummere, John W. Basore, Walter Miller, C. D. Yonge, R. D. Hicks, A. C. Pearson, G. H. Rendall, C. R. Haines) and name the translator and year.",
    "- If no public-domain translation exists, translate it yourself from the Greek or Latin and set translator to \"Translated for Dalton Daily\".",
    "- The passage itself: 40 to 180 words. Keep the translation's wording exactly; you may trim with an ellipsis.",
    "- Plain text only inside the JSON: no citation markup, no <cite> tags, no HTML. Never refer to yourself or your searches.",
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
    author: scrub(r.author || ""),
    work: scrub(r.work || ""),
    citation: scrub(r.citation || ""),
    translator: scrub(r.translator || ""),
    url: /^https:\/\//.test(r.url || "") ? r.url : "",
    passage: scrub(r.passage || ""),
    context: scrub(r.context || ""),
    reflection: scrub(r.reflection || ""),
    practice: scrub(r.practice || ""),
    obscure: focus.obscure,
  };
}


// The Commonplace Book: one well-chosen idea a day, explained clearly and checked against good sources.
const COMMONPLACE = [
  { field: "Philosophy", hint: "an argument, thought experiment, school or thinker (ancient to modern, any tradition)" },
  { field: "Theology", hint: "a doctrine, council, controversy, mystic or theologian, treated historically and even-handedly" },
  { field: "Metaphysics", hint: "a problem such as identity, causation, time, universals, free will or the mind-body problem, and the main answers given" },
  { field: "History", hint: "a specific event, decision, document or turning point, with dates, people and consequences" },
  { field: "Science", hint: "a discovery, experiment, law or open question, with how it was found and what it explains" },
  { field: "Literature", hint: "a work, author, form or movement, with why it lasted and a passage-level sense of its style" },
  { field: "Entrepreneurship", hint: "a founder's decision, business model, case study or principle from business history, with numbers where known" },
];

export function commonplaceFocus(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return COMMONPLACE[day % COMMONPLACE.length];
}

export async function writeCommonplace(env, ctx, dateIso) {
  const focus = commonplaceFocus(dateIso);
  const recent = ctx.recentCommonplace || [];
  const system = [
    `You write "The Commonplace Book", a daily short essay in Dalton Daily, a morning newspaper. Today is ${ctx.longDate}.`,
    "Pick one specific, genuinely interesting subject a curious, well-read adult may not know well, and explain it so it sticks.",
    "Rules:",
    "- Be accurate. Check names, dates and claims with your searches and prefer encyclopedias, primary texts and scholarly sources.",
    "- Write entirely in your own words. No quotations longer than a short phrase, except public-domain texts.",
    "- Concrete over abstract: a scene, a number, a person, a consequence. No filler, no moralizing.",
    "- Plain text only inside the JSON: no citation markup, no <cite> tags, no HTML. Never refer to yourself or your searches.",
    "- Return ONLY JSON wrapped in <json></json>.",
  ].join("\n");
  const prompt = [
    `Today's field: ${focus.field} — ${focus.hint}.`,
    recent.length ? `Do NOT repeat any of these recent subjects:\n- ${recent.join("\n- ")}` : "",
    'JSON shape: <json>{"field":"' + focus.field + '","title":"A short, specific title","dek":"One line on why it is worth knowing","essay":"220-320 words in three or four short paragraphs separated by a blank line","takeaway":"One sentence to remember","further":"A good next read: author and title","source":"Name of the main source","url":"https://..."}</json>',
  ].filter(Boolean).join("\n\n");
  const { text, citedUrls } = await callClaude(env, {
    system,
    prompt,
    maxTokens: 3000,
    tools: [{
      type: "web_search_20250305", name: "web_search", max_uses: 4,
      allowed_domains: ["plato.stanford.edu", "iep.utm.edu", "britannica.com", "en.wikipedia.org", "newadvent.org", "ccel.org", "perseus.tufts.edu", "gutenberg.org", "nature.com", "science.org", "nasa.gov", "si.edu", "loc.gov", "archives.gov", "history.state.gov", "hbs.edu", "hbr.org", "nobelprize.org", "royalsociety.org", "bl.uk", "metmuseum.org", "poetryfoundation.org", "jstor.org"],
    }],
  });
  const r = extractJson(text);
  let url = /^https:\/\//.test(r.url || "") ? r.url : [...citedUrls.keys()][0] || "";
  return {
    field: scrub(r.field || focus.field),
    title: scrub(r.title || ""),
    dek: scrub(r.dek || ""),
    essay: scrub(r.essay || ""),
    takeaway: scrub(r.takeaway || ""),
    further: scrub(r.further || ""),
    source: scrub(r.source || ""),
    url,
  };
}

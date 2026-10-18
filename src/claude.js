// Claude API client with the server-side web search tool.
import { READER_PROFILE } from "./sections.js";

const API = "https://api.anthropic.com/v1/messages";
const KINDS = ["primary", "wire", "legacy", "foreign", "investigative", "independent", "trade", "research", "magazine"];
// Aggregators, syndication mirrors and SEO content farms: search around them so the original gets linked.
const BLOCKED = [
  "yahoo.com", "msn.com", "newsbreak.com", "ground.news", "investing.com", "trefis.com", "marketchameleon.com",
  "tradingkey.com", "discoveryalert.com", "biggo.com", "benzinga.com", "marketbeat.com", "fool.com",
  "ts2.tech", "opentools.ai", "theoutpost.ai", "devdiscourse.com", "newsnow.co.uk",
];

export async function callClaude(env, { system, prompt, tools = [], maxTokens = 8000 }) {
  const messages = [{ role: "user", content: prompt }];
  const texts = [];
  const citedUrls = new Map();
  let searches = 0;

  for (let turn = 0; turn < 6; turn++) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.MODEL || "claude-sonnet-5-5",
        max_tokens: maxTokens,
        system,
        messages,
        ...(tools.length ? { tools } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = await res.json();
    searches += data.usage?.server_tool_use?.web_search_requests || 0;

    for (const block of data.content || []) {
      if (block.type === "text") {
        texts.push(block.text);
        for (const c of block.citations || []) {
          if (c.url) citedUrls.set(c.url, c.title || c.url);
        }
      }
    }
    // Long search turns can pause; send the paused message back unchanged to continue.
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }
    return { text: texts.join(""), citedUrls, searches };
  }
  throw new Error("Claude API: too many paused turns");
}

export function extractJson(text) {
  const tagged = text.match(/<json>([\s\S]*?)<\/json>/);
  const raw = tagged ? tagged[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

// Remove citation markup and stray tags the model sometimes copies into its JSON text.
export function scrub(t) {
  return String(t || "")
    .replace(/<\/?cite\b[^>]*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanStory(s) {
  const sources = Array.isArray(s.sources)
    ? s.sources
        .filter((x) => x && typeof x.url === "string" && /^https?:\/\//.test(x.url))
        .map((x) => ({
          name: String(x.name || new URL(x.url).hostname.replace(/^www\./, "")),
          url: x.url,
          kind: KINDS.includes(x.kind) ? x.kind : "",
        }))
        .slice(0, 5)
    : [];
  return {
    headline: scrub(s.headline),
    dek: scrub(s.dek),
    body: scrub(s.body),
    why: scrub(s.why),
    dateline: scrub(s.dateline),
    importance: Math.max(1, Math.min(10, Number(s.importance) || 5)),
    update: Boolean(s.update),
    sources,
  };
}

export async function reportSection(env, section, ctx) {
  const today = ctx.longDate;
  const system = [
    `You are a staff reporter for Dalton Daily, a private one-reader morning newspaper. Today is ${today}.`,
    READER_PROFILE,
    "House rules:",
    "- Report only what your searches confirm. Never invent facts, figures, quotes, or sources.",
    "- Prioritize the last 24-36 hours. For culture sections, this week's releases and reviews are fine.",
    "- Write every summary in your own words. Do not copy sentences from sources; a quoted phrase must be under 12 words and rare.",
    "- Neutral, factual, newspaper tone. On contested political subjects present the facts and the main positions fairly without taking sides.",
    "- Every story needs at least one source URL that you actually found in search results.",
    "Sourcing (important): do not rely only on U.S. legacy media. For each section, actively search beyond it:",
    "  * Primary sources first where they exist: court opinions and filings (supremecourt.gov, CourtListener, PACER summaries), government releases,",
    "    the Federal Register, congress.gov, SEC/EDGAR filings, central-bank statements, agency data, peer-reviewed papers and arXiv/medRxiv preprints,",
    "    official mission pages (NASA, ESA), company filings and press releases.",
    "  * Foreign and regional press: e.g. The Guardian, BBC, Financial Times, Le Monde, Der Spiegel, Al Jazeera, Haaretz, Times of Israel, Kyiv Independent,",
    "    Meduza, South China Morning Post, Nikkei Asia, Caixin, The Hindu, Dawn, Africa Report, Folha, El País, Reuters and AFP wires.",
    "  * Investigative and specialist outlets: ProPublica, Bellingcat, ICIJ, OCCRP, The Intercept, Lawfare, Just Security, War on the Rocks, Semafor,",
    "    404 Media, Rest of World, The Information, and serious trade press.",
    "  * Policy and ideas magazines: Foreign Policy, Foreign Affairs, The Economist, The Atlantic, The Diplomat, The National Interest,",
    "    Responsible Statecraft, Defense One, Breaking Defense, The Record, Noema, and similar.",
    "  * Independent writers and newsletters (Substack and similar) with real expertise or original reporting.",
    "- Aim for a mix: across a section's stories, include at least one primary source and at least one non-U.S. or independent/investigative source when they exist.",
    "- Prefer the original over a rewrite: link the court filing, the study, the foreign outlet that broke it, not the aggregator.",
    "- Treat newsletters and partisan outlets as claims, not facts: say who is claiming what, and note when something is not independently confirmed.",
    "- Never cite aggregators, syndication copies, stock-promo or SEO content-farm sites. If a story appears there, find and link the original.",
    "- For each source, give its kind, precisely:",
    "    primary = the document itself (filing, opinion, statute, release, dataset, paper, official statement)",
    "    wire = Reuters, AP, AFP, Bloomberg wire;  legacy = major U.S. national or local newspapers and networks",
    "    foreign = a news outlet based outside the U.S.;  investigative = outlets whose core work is investigations (ProPublica, Bellingcat, ICIJ, OCCRP...)",
    "    independent = a named writer's own newsletter or site (Substack, Ghost, personal blog) with real expertise",
    "    magazine = policy, ideas and general-interest magazines (Foreign Policy, Foreign Affairs, The Economist, The Atlantic...)",
    "    trade = specialist industry press (Utility Dive, BleepingComputer, Law360, Variety...);  research = think tanks, NGOs, data/monitoring groups, law-firm client alerts",
    "- Write as the newspaper, in the third person. Never refer to yourself, your searches or 'the pages I found'. If a detail such as a price is unknown, leave it out rather than saying it could not be found.",
    "- Plain text only inside the JSON: no citation markup, no <cite> tags, no HTML, no markdown.",
    "- Return ONLY a JSON object wrapped in <json></json> tags. No other prose.",
  ].join("\n");

  const recent = ctx.recentHeadlines[section.key] || [];
  const liked = ctx.liked[section.key] || [];
  const disliked = ctx.disliked[section.key] || [];

  const prompt = [
    `Beat: ${section.name}`,
    `Assignment: ${section.brief}`,
    section.optional
      ? `File up to ${section.count} stories, ranked most important first. If there is no genuinely new development, return {"stories":[]} rather than padding.`
      : `File ${section.count} stories, ranked most important first.`,
    recent.length
      ? `Already published in the last ${section.lookback || 3} days (do NOT repeat these unless there is a genuine new development; if you do, set "update": true and lead with what is new):\n- ${recent.join("\n- ")}`
      : "",
    liked.length ? `The reader liked these past stories in this section (more like this):\n- ${liked.join("\n- ")}` : "",
    disliked.length ? `The reader disliked these past stories (less like this):\n- ${disliked.join("\n- ")}` : "",
    "",
    "JSON shape:",
    `<json>{"stories":[{"headline":"Short newspaper headline, under 14 words","dek":"One-line subheadline","dateline":"CITY or blank","body":"Summary of 90-150 words in your own words: what happened, key numbers, who, and what comes next","why":"One sentence on why it matters","importance":1-10 (10 = front-page news anywhere),"update":false,"sources":[{"name":"Outlet or document name","url":"https://...","kind":"primary|wire|legacy|foreign|investigative|independent|trade|research|magazine"}]}]}</json>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const searchTool = {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: Number(env.SEARCHES_PER_SECTION || 5),
    blocked_domains: BLOCKED,
  };
  if (section.local) {
    searchTool.user_location = {
      type: "approximate", city: "Memphis", region: "Tennessee", country: "US", timezone: "America/Chicago",
    };
  }

  const { text, citedUrls, searches } = await callClaude(env, { system, prompt, tools: [searchTool] });
  let parsed;
  try {
    parsed = extractJson(text);
  } catch (e) {
    throw new Error(`Could not parse ${section.key} JSON: ${text.slice(0, 300)}`);
  }
  const stories = (parsed.stories || []).map(cleanStory).filter((s) => s.headline && s.body);
  // Backfill sources from citations if the model left a story without any.
  const fallback = [...citedUrls.entries()].slice(0, 2).map(([url, title]) => ({ name: title, url }));
  for (const s of stories) if (!s.sources.length) s.sources = fallback;
  return { stories: stories.slice(0, section.count), searches };
}

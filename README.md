# Dalton Daily

A morning newspaper at https://www.daltondaily.com (the bare domain redirects to www). Standalone project: its own Worker, D1 database and repo, nothing shared with Dalton Digital.

## How it works

- Printed **by 3:00 AM Central** every day: a cron starts the Workflow at 2:00 AM, with a backup attempt at 2:30 AM if the first did not land.
- Reporters are told to source beyond U.S. legacy media: primary documents, foreign press, investigative outlets and independent newsletters. Each source is tagged by kind.
- The Workflow reports 17 sections (6 at a time). Each section is one Claude API call with the web search tool, returning JSON stories. Each section is its own durable step with retries, so one failure never blocks the paper.
- The 5 most important stories (one per section max) make the front page.
- Comics: xkcd (JSON API), Poorly Drawn Lines, Existential Comics and SMBC (publishers' feeds).
- Story photos: each story's lead image is the og:image its publisher sets for sharing, taken from the first source that has one; site-wide default images are dropped.
- Reflections: a daily scripture (passage chosen by Claude, verse text from bible-api.com, World English Bible), a daily Stoic reading (major Stoics alternating with lesser-known figures and fragments, from public-domain translations or translated fresh), and the Commonplace Book, a short checked essay rotating through philosophy, theology, metaphysics, history, science, literature and entrepreneurship.
- Photos: every story gets one; the publisher's share image first, otherwise a Wikipedia or Wikimedia Commons photo of the story's subject.
- Market ticker under the menu: indices, yields, commodities, currencies and crypto (Yahoo Finance chart API, cached 5 minutes at /api/ticker).
- Memphis weather from Open-Meteo.
- Stories from the last 3 days are fed back in so editions don't repeat; ▲/▼ votes are fed back per section to steer coverage.

## Routes

| Path | What |
|---|---|
| `/` | Front page: lead stories, In Pictures, Reflections, and a sampler from every desk |
| `/world`, `/business`, `/technology`, `/law`, `/memphis`, `/ideas`, `/culture`, `/sports`, `/travel`, `/reflections`, `/comics` | Each desk on its own page |
| `/YYYY-MM-DD` and `/YYYY-MM-DD/<page>` | A past edition |
| `/archive` | All editions |
| `/admin/run` | Print today's edition now (`?date=YYYY-MM-DD` for another day) |
| `/admin/status` | Last 15 runs, story counts, searches, errors |

No login. Public and indexable: canonical URLs, Open Graph/Twitter cards (share image at /og.jpg), JSON-LD, /sitemap.xml, /robots.txt, /feed.xml (RSS), and an IndexNow ping after each edition. The workers.dev and bare-domain addresses 301 to www. `/admin/run` is limited to one print per 20 minutes.

## Config

`wrangler.toml` vars: `MODEL`, `EDITION_HOUR`, `SEARCHES_PER_SECTION`, `TIMEZONE`.
Sections and their briefs: `src/sections.js`.

## Deploy

Push to `main`. GitHub Actions applies `schema.sql` and runs `wrangler deploy`.

Repo secrets required: `CLOUDFLARE_API_TOKEN` (Account: Workers Scripts Edit, D1 Edit, Account Settings Read; Zone daltondaily.com: Workers Routes Edit, DNS Edit), `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.

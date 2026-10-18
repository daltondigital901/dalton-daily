# Dalton Daily

A private, one-reader morning newspaper. Standalone project: its own Worker, D1 database and repo, nothing shared with Dalton Digital.

## How it works

- **3:00 AM Central** every day, a cron starts a Cloudflare Workflow for that date.
- The Workflow reports 17 sections (6 at a time). Each section is one Claude API call with the web search tool, returning JSON stories. Each section is its own durable step with retries, so one failure never blocks the paper.
- The 5 most important stories (one per section max) make the front page.
- Comics: xkcd (JSON API), Existential Comics and SMBC (publishers' RSS), Calvin and Hobbes (link to the GoComics daily strip).
- Morning Reflections: a daily scripture (passage chosen by Claude, verse text from bible-api.com, World English Bible) and a daily SLAA reading written in Claude's own words from SLAA documents on slaafws.org, linked to the source. About 7 days in 10 focus on limerence and recovery.
- Memphis weather from Open-Meteo.
- Stories from the last 3 days are fed back in so editions don't repeat; ▲/▼ votes are fed back per section to steer coverage.

## Routes

| Path | What |
|---|---|
| `/` | Latest edition |
| `/YYYY-MM-DD` | A past edition |
| `/archive` | All editions |
| `/admin/run` | Print today's edition now (`?date=YYYY-MM-DD` for another day) |
| `/admin/status` | Last 15 runs, story counts, searches, errors |

No login. The page is unlisted (noindex, robots.txt disallow). `/admin/run` is limited to one print per 20 minutes.

## Config

`wrangler.toml` vars: `MODEL`, `EDITION_HOUR`, `SEARCHES_PER_SECTION`, `TIMEZONE`.
Sections and their briefs: `src/sections.js`.

## Deploy

Push to `main`. GitHub Actions applies `schema.sql` and runs `wrangler deploy`.

Repo secrets required: `CLOUDFLARE_API_TOKEN` (Account: Workers Scripts Edit, D1 Edit, Account Settings Read), `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.

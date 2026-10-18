// Anthropic Message Batches: the same requests at half the token price, returned asynchronously.
// The overnight edition is submitted as one batch; anything not back by the deadline is reported live.
import { requestBody, newOutcome, collect } from "./claude.js";

const BASE = "https://api.anthropic.com/v1/messages/batches";
const headers = (env) => ({ "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" });

export async function submitBatch(env, items) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify({ requests: items.map(({ id, req }) => ({ custom_id: id, params: requestBody(env, req) })) }),
  });
  if (!res.ok) throw new Error(`Batch submit ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return (await res.json()).id;
}

export async function getBatch(env, id) {
  const res = await fetch(`${BASE}/${id}`, { headers: headers(env) });
  if (!res.ok) throw new Error(`Batch get ${res.status}`);
  return res.json();
}

export async function cancelBatch(env, id) {
  await fetch(`${BASE}/${id}/cancel`, { method: "POST", headers: headers(env) }).catch(() => {});
}

// Read the JSONL results and fold each finished message into a compact outcome.
// Requests that paused mid-search, errored, expired or were canceled are left out (reported live instead).
export async function batchResults(env, url) {
  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) throw new Error(`Batch results ${res.status}`);
  const text = await res.text();
  const out = {};
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    const msg = row.result?.type === "succeeded" ? row.result.message : null;
    if (!msg || msg.stop_reason === "pause_turn" || msg.stop_reason === "max_tokens") continue;
    const o = collect(newOutcome(), msg);
    out[row.custom_id] = { text: o.texts.join(""), citedUrls: o.citedUrls, searches: o.searches, usage: o.usage };
  }
  return out;
}

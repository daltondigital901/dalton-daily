// Renders the print edition to an 11 x 17 in PDF with headless Chromium.
// Each part (front page, each desk, Reflections, comics) is rendered on its own. If shrinking a part
// slightly (down to 86%) saves a page, the smaller version is used, so no section ends with a near-empty page.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync } from "fs";

const date = process.argv[2] || "";
const out = process.argv[3] || `print/dalton-daily-${date || "latest"}.pdf`;
const base = `https://www.daltondaily.com/print${date ? "/" + date : ""}`;
const PARTS = ["front", "world", "business", "technology", "law", "memphis", "ideas", "culture", "sports", "travel", "reflections", "comics"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1056, height: 1632 } });
const merged = await PDFDocument.create();
const report = [];

for (const part of PARTS) {
  await page.goto(`${base}?only=${part}`, { waitUntil: "networkidle", timeout: 120000 });
  const has = await page.evaluate(async () => {
    await document.fonts.ready;
    for (let i = 0; i < 40; i++) {
      if (![...document.images].some((im) => !im.complete)) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    return document.querySelectorAll(".pg").length;
  });
  if (!has) continue;
  await page.emulateMedia({ media: "print" });
  const render = (scale) => page.pdf({ width: "11in", height: "17in", printBackground: true, preferCSSPageSize: true, scale });
  let best = await render(1);
  let bestCount = (await PDFDocument.load(best)).getPageCount();
  let used = 1;
  if (bestCount > 1) {
    for (const sc of [0.96, 0.92, 0.89, 0.86]) {
      const pdf = await render(sc);
      const n = (await PDFDocument.load(pdf)).getPageCount();
      if (n < bestCount) { best = pdf; bestCount = n; used = sc; break; }
    }
  }
  const doc = await PDFDocument.load(best);
  const copied = await merged.copyPages(doc, doc.getPageIndices());
  copied.forEach((p) => merged.addPage(p));
  report.push(`${part}:${bestCount}${used < 1 ? "@" + used : ""}`);
}
// Even page count so the last sheet prints double-sided cleanly.
if (merged.getPageCount() % 2) merged.addPage([792, 1224]);
writeFileSync(out, await merged.save());
console.log(`::notice title=print::${out} pages=${merged.getPageCount()} ${report.join(" ")}`);
await browser.close();

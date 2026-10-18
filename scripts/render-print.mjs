// Renders the print edition to an 11 x 17 in PDF with headless Chromium.
import { chromium } from "playwright";
const date = process.argv[2] || "";
const out = process.argv[3] || `print/dalton-daily-${date || "latest"}.pdf`;
const url = `https://www.daltondaily.com/print${date ? "/" + date : ""}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1056, height: 1632 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.evaluate(async () => {
  await document.fonts.ready;
  // Wait for every image (including fallbacks that swap in) to settle.
  for (let i = 0; i < 40; i++) {
    const pending = [...document.images].filter((im) => !im.complete);
    if (!pending.length) break;
    await new Promise((r) => setTimeout(r, 500));
  }
});
await page.emulateMedia({ media: "print" });
await page.pdf({ path: out, width: "11in", height: "17in", printBackground: true, preferCSSPageSize: true });
const pages = await page.evaluate(() => document.querySelectorAll(".pg").length);
console.log(`::notice title=print::${out} from ${url} (${pages} sections)`);
await browser.close();

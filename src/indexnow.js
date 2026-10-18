// IndexNow lets Bing, Yandex, Seznam and others pick up each new edition within minutes.
export const INDEXNOW_KEY = "9036bdbc1d73be9859689b46dc3abbbe";

export async function pingIndexNow(site, paths) {
  const host = new URL(site).host;
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${site}/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => site + p) }),
  });
}

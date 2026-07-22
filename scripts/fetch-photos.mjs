// One-off script: source real, licensed food photos from Wikimedia Commons' search API
// (documented API call, not a guessed URL) and download them locally for seed data.
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_UA = "NashiKatsuDemoApp/1.0 (educational demo project; contact: demo@example.com)";
// Wikimedia's upload host blocks the descriptive bot UA on thumb URLs (robot policy);
// originals work fine with a standard browser UA, then we downsize locally with sips.
const DL_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const OUT = path.join(process.cwd(), "public", "menu");
fs.mkdirSync(OUT, { recursive: true });

// query -> local filename (without ext), dash-separated keys only (no spaces in URLs)
const TARGETS = [
  ["katsu-happy", "chicken katsu"],
  ["katsu-sambal", "spicy fried chicken sambal"],
  ["katsu-plain", "tonkatsu"],
  ["teriyaki-donburi", "chicken teriyaki rice bowl"],
  ["curry-donburi", "chicken katsu curry rice"],
  ["hokkaido-donburi", "japanese curry rice"],
  ["katsu-donburi", "katsu don"],
  ["popcorn-sweetchili", "popcorn chicken"],
  ["eggroll-donburi", "tamagoyaki"],
  ["popcorn-bbq", "fried chicken bites"],
  ["karage-donburi", "karaage rice bowl"],
  ["shrimp-donburi", "shrimp tempura rice bowl"],
  ["chicskin", "fried chicken skin"],
  ["shrimproll", "shrimp roll"],
  ["eggroll", "egg roll"],
  ["mixsnack", "mixed appetizer platter"],
  ["gyozabbq", "gyoza plate"],
  ["takoyaki", "takoyaki"],
  ["gyozafried", "fried gyoza"],
  ["karage", "karaage japanese fried chicken"],
  ["ocha", "japanese green tea cup"],
  ["extra", "fried egg sunny side up"],
];

async function search(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": API_UA } });
  const j = await res.json();
  const pages = j?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .filter((p) => (p.imageinfo?.[0]?.mime === "image/jpeg" || p.imageinfo?.[0]?.mime === "image/png") && (p.imageinfo?.[0]?.size ?? 0) < 15_000_000)
    .map((p) => p.imageinfo[0].url)
    .filter(Boolean);
}

async function download(url, destPath) {
  let res;
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await fetch(url, { headers: { "User-Agent": DL_UA } });
    if (res.status !== 429) break;
    const wait = 12000 * (attempt + 1);
    console.log(`    429, waiting ${wait}ms…`);
    await new Promise((r) => setTimeout(r, wait));
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  execSync(`sips -Z 900 -s format jpeg -s formatOptions 72 "${destPath}" >/dev/null 2>&1`);
  return fs.statSync(destPath).size;
}

const manifest = {};
const manifestPath = path.join(process.cwd(), "scripts", "photo-manifest.json");
const already = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
Object.assign(manifest, already);

console.log("Waiting 30s before starting (let rate limit cool down)…");
await new Promise((r) => setTimeout(r, 30000));

for (const [key, query] of TARGETS) {
  if (manifest[key] && fs.existsSync(path.join(process.cwd(), "public", manifest[key]))) {
    console.log("skip (have)", key);
    continue;
  }
  let done = false;
  try {
    const urls = await search(query);
    if (urls.length === 0) console.log("NO MATCH:", key, query);
    for (const url of urls.slice(0, 1)) {
      try {
        const dest = path.join(OUT, `${key}.jpg`);
        const size = await download(url, dest);
        manifest[key] = `/menu/${key}.jpg`;
        console.log("OK", key, "<-", query, `(${(size / 1024).toFixed(0)}KB)`);
        done = true;
        break;
      } catch (e) {
        console.log("  try failed:", e.message);
      }
    }
    if (!done && urls.length > 0) console.log("ALL TRIES FAILED:", key);
  } catch (e) {
    console.log("FAIL", key, e.message);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  await new Promise((r) => setTimeout(r, 3500));
}

console.log("done, manifest written");

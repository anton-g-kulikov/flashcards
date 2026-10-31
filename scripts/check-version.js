// Runs before every hosting deploy (firebase.json "predeploy"). Installed apps serve their files
// from the service worker's cache and only fetch a new copy when CACHE_NAME in sw.js changes,
// which follows VERSION in src/core/version.js. So a deploy that changes any cached file must
// also raise VERSION, or installed apps would never see it. This compares the local files with
// the live ones and stops the deploy if they differ under the same version.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LIVE = "https://yourflashcards.app";
const sw = readFileSync("public/sw.js", "utf8");
const files = [...sw.match(/const urlsToCache = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)]
  .map(([, url]) => url)
  .filter((url) => url !== "/");

const version = (text) => text.match(/VERSION = "([^"]+)"/)?.[1];
const local = version(readFileSync("public/src/core/version.js", "utf8"));

let live;
try {
  const response = await fetch(`${LIVE}/src/core/version.js`, { cache: "no-store" });
  live = response.ok ? version(await response.text()) : undefined;
} catch (error) {
  console.warn(`Could not reach ${LIVE} to compare versions (${error.message}); deploying anyway.`);
  process.exit(0);
}

if (live !== local) {
  console.log(`Version ${live ?? "(none)"} → ${local}`);
  process.exit(0);
}

const changed = [];
for (const url of files) {
  const path = join("public", url.split("?")[0]);
  const response = await fetch(LIVE + url, { cache: "no-store" });
  const liveBytes = response.ok ? Buffer.from(await response.arrayBuffer()) : null;
  if (!liveBytes || !liveBytes.equals(readFileSync(path))) changed.push(url);
}

if (changed.length > 0) {
  console.error(
    `These files differ from ${LIVE}, but VERSION is still ${local}:\n  ${changed.join("\n  ")}\n` +
      "Raise VERSION in public/src/core/version.js and CACHE_NAME in public/sw.js, or installed " +
      "apps will keep the old files."
  );
  process.exit(1);
}
console.log(`Version ${local}: no app file changed.`);

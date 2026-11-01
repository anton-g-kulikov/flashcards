// Writes firebase.dev.json for `npm run dev`: firebase.json with the local emulators' addresses
// added to the Content-Security-Policy, so the deployed policy never carries them. The hosting
// emulator serves firebase.json's headers, and the app on 127.0.0.1 talks to the Auth (9099) and
// Firestore (8080) emulators, which the strict policy would block. firebase.dev.json is
// git-ignored and rewritten on every `npm run dev`.
import { readFileSync, writeFileSync } from "node:fs";

const EMULATORS = {
  "connect-src": ["http://127.0.0.1:8080", "http://127.0.0.1:9099"],
  "frame-src": ["http://127.0.0.1:9099"],
};

export function withEmulators(policy) {
  return policy
    .split(";")
    .map((directive) => {
      const name = directive.trim().split(/\s+/)[0];
      return EMULATORS[name] ? `${directive.trim()} ${EMULATORS[name].join(" ")}` : directive.trim();
    })
    .join("; ");
}

if (process.argv[1]?.endsWith("dev-config.js")) {
  const config = JSON.parse(readFileSync("firebase.json", "utf8"));
  for (const rule of config.hosting.headers) {
    for (const header of rule.headers) {
      if (header.key === "Content-Security-Policy") header.value = withEmulators(header.value);
    }
  }
  delete config.hosting.predeploy; // emulators don't deploy
  writeFileSync("firebase.dev.json", JSON.stringify(config, null, 2) + "\n");
  console.log("Wrote firebase.dev.json (CSP with the emulator addresses)");
}

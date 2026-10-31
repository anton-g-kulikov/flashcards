// Card text (words, translations) is user data: typed in, or imported from someone else's CSV.
// It must reach the page as text. This guards against putting it into innerHTML unescaped, which
// once let an imported translation run script with the reader's session.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });
}

describe("card text never goes into innerHTML unescaped", () => {
  for (const file of jsFiles("public/src")) {
    it(file, () => {
      const source = readFileSync(file, "utf8");
      // Every innerHTML template literal...
      for (const [, template] of source.matchAll(/innerHTML\s*=\s*`([^`]*)`/g)) {
        // ...may interpolate only values that are not card text, or card text through I18n.escape
        for (const [, expression] of template.matchAll(/\$\{([^}]*)\}/g)) {
          const cardText = /\b(word|translation|displayText|translationText)\b/.test(expression);
          const escaped = /I18n\.(escape|t)\(/.test(expression);
          assert.ok(!cardText || escaped, `${file}: \${${expression}} puts card text into innerHTML`);
        }
      }
    });
  }
});

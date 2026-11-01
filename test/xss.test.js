// Card text (words, translations) is user data: typed in, or imported from someone else's CSV.
// It must reach the page as text. This guards every place a script can write HTML, which once let
// an imported translation run script with the reader's session.
//
// Every innerHTML / outerHTML assignment in public/src must be an empty string, a template
// literal whose ${...} parts are all translation-table text (I18n.t / I18n.escape), or one of
// the reviewed assignments in TRUSTED below. insertAdjacentHTML and document.write are not used
// at all. A new HTML sink fails here until it is made safe or reviewed and listed.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Reviewed sinks: file → the exact right-hand sides (or ${...} parts) allowed there, and why
const TRUSTED = {
  "i18n.js": ["I18n.t(el.dataset.i18nHtml)"], // markup from the translation table
  "message-card.js": ["hintHtml"], // only ever I18n.t(...) text, any word in it escaped
  "confirm-button.js": ["button.dataset.originalHtml"], // the button's own HTML, put back
  "word-manager.js": ["icon(name)", 'icon("chevron")'], // fixed SVG from the ICONS table
  "theme-switch.js": ["ICONS[option]"], // fixed SVG from the ICONS table
  "quiz-mode.js": ["iconPath"], // CHECK_ICON or CROSS_ICON, fixed path data
};

const SAFE_PART = /^I18n\.(t|escape)\(/;

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });
}

// The right-hand side of each `.innerHTML =` / `.outerHTML =`: a whole template literal, or the
// expression up to the end of the statement
function sinks(source) {
  const found = [];
  const pattern = /\.(innerHTML|outerHTML)\s*=(?!=)\s*/g;
  let match;
  while ((match = pattern.exec(source))) {
    const start = match.index + match[0].length;
    if (source[start] === "`") {
      const end = source.indexOf("`", start + 1);
      found.push({ template: source.slice(start + 1, end) });
    } else {
      const end = source.indexOf(";", start);
      found.push({ expression: source.slice(start, end).trim() });
    }
  }
  return found;
}

describe("HTML sinks only ever receive reviewed, non-user markup", () => {
  for (const file of jsFiles("public/src")) {
    it(file, () => {
      const source = readFileSync(file, "utf8");
      const trusted = TRUSTED[basename(file)] || [];
      assert.doesNotMatch(source, /insertAdjacentHTML|document\.write/, `${file}: raw HTML insertion`);

      for (const sink of sinks(source)) {
        if (sink.template !== undefined) {
          for (const [, part] of sink.template.matchAll(/\$\{([^}]*)\}/g)) {
            const ok = SAFE_PART.test(part.trim()) || trusted.includes(part.trim());
            assert.ok(ok, `${file}: \${${part}} goes into HTML unreviewed`);
          }
        } else {
          const ok = sink.expression === '""' || trusted.includes(sink.expression);
          assert.ok(ok, `${file}: innerHTML = ${sink.expression} is unreviewed`);
        }
      }
    });
  }

  it("catches what it is meant to catch", () => {
    assert.deepEqual(sinks("el.innerHTML = card.word;"), [{ expression: "card.word" }]);
    assert.deepEqual(sinks("el.outerHTML = `<b>${text}</b>`;"), [{ template: "<b>${text}</b>" }]);
    assert.deepEqual(sinks("if (el.innerHTML === x) {}"), []);
  });
});

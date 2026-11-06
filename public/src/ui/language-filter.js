// The dropdown above the starter collections, on the landing page and under Import in My Cards:
// "All languages", then each language pair the collections have.
import { languagePair } from "../core/card-data.js";
import { I18n } from "./i18n.js";

// Fills it from a list of pairs ("es-en"), repeats allowed, keeping the choice already made. Its
// value is the chosen pair, empty for all of them.
export function fillLanguageFilter(select, pairs) {
  const chosen = select.value;
  select.innerHTML = "";
  select.add(new Option(I18n.t("collections.allLanguages"), ""));
  new Set(pairs).forEach((pair) => {
    const { word, translation } = languagePair(pair);
    select.add(new Option(`${I18n.languageName(word)} → ${I18n.languageName(translation)}`, pair));
  });
  select.value = chosen;
}

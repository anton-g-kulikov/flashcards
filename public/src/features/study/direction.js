// Which way round the study page's collections run, for the switch below the cards. No DOM here:
// the tests import it directly.
import { languagePair } from "../../core/card-data.js";

// `first` and `second` are the sides in the order the cards show them, each with its language when
// the collections all share one pair. When only some collections are reversed, `mixed` is true and
// the sides stay word first; `reversed` is true only when every one is.
export function studyDirection(collections) {
  const count = collections.filter((c) => c.reversed).length;
  const reversed = collections.length > 0 && count === collections.length;
  const pairs = new Set(collections.map((c) => c.language || ""));
  const languages = pairs.size === 1 ? languagePair([...pairs][0]) : {};
  const word = { side: "word", language: languages.word || "" };
  const translation = { side: "translation", language: languages.translation || "" };
  return {
    reversed,
    mixed: count > 0 && !reversed,
    first: reversed ? translation : word,
    second: reversed ? word : translation,
  };
}

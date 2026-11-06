// Word list pages (public/words/) are written in the language of the people who search for them.
// This shows one in the language used in the app instead: the generator puts each text's
// translations in data-text-* attributes, and data-label-* for an icon button's name.
//
// Only a saved language counts, never the browser's. A crawler runs this with an English browser
// and nothing saved, and has to see each page as written. App pages save the language they use
// (I18n.remember), so anyone who has opened the app is followed.
//
// A classic script at the end of the page, so the text changes before it paints. The key matches
// i18n.js.
(function () {
  var lang = null;
  try {
    lang = localStorage.getItem("flashcards-ui-language");
  } catch (error) {
    return; // No storage: the page as written is a fine answer
  }
  if (lang !== "en" && lang !== "ru" && lang !== "es") return;

  document.querySelectorAll("[data-text-" + lang + "]").forEach(function (element) {
    element.textContent = element.getAttribute("data-text-" + lang);
  });
  document.querySelectorAll("[data-label-" + lang + "]").forEach(function (element) {
    var label = element.getAttribute("data-label-" + lang);
    element.setAttribute("aria-label", label);
    element.setAttribute("title", label);
  });
  document.documentElement.lang = lang;
})();

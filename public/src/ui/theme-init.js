// Applies a saved light or dark choice before the page paints, so it never flashes the device's
// scheme first. A classic script loaded in <head> on purpose: modules only run once the page is
// parsed. The choice itself is made in theme-switch.js; the key and colours match theme.js.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("flashcards-theme");
  } catch (error) {
    // No storage: the device's own scheme is a fine answer
  }
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.dataset.theme = theme;
  var colors = { light: "#c17743", dark: "#161412" };
  document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
    meta.content = colors[theme];
  });
})();

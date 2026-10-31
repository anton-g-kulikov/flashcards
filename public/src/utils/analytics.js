// Google Analytics (GA4 property "flashcards-ak-app", linked to the Firebase project): which
// features get used. Names, emails, account ids and words are never sent. Not loaded on
// localhost, so development stays out of the stats.
const MEASUREMENT_ID = "G-E0J0MDFKE6";
const enabled = !["localhost", "127.0.0.1"].includes(location.hostname);

if (enabled) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(tag);
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID);
}

function send(name, params = {}) {
  if (enabled) window.gtag("event", name, params);
}

// Time spent in each study mode, sent when the mode changes or the page is left
const mode = { name: null, since: 0 };
function endMode() {
  if (!mode.name) return;
  send("study_time", { mode: mode.name, seconds: Math.round((Date.now() - mode.since) / 1000) });
  mode.since = Date.now();
}
window.addEventListener("pagehide", endMode);

document.addEventListener("i18n-changed", (event) => {
  send("language_switch", { language: event.detail.lang });
});

export const Analytics = {
  studyStart(modeName, cards, known) {
    send("study_start", { mode: modeName, cards, known });
  },
  // A mode shown by the app itself: timed, but not counted as a switch
  modeStarted(name) {
    endMode();
    mode.name = name;
    mode.since = Date.now();
  },
  modeSwitch(name) {
    Analytics.modeStarted(name);
    send("mode_switch", { mode: name });
  },
  cardMarked(known) {
    send("card_marked", { answer: known ? "known" : "unknown" });
  },
  quizAnswer(correct) {
    send("quiz_answer", { result: correct ? "correct" : "wrong" });
  },
  progressReset() {
    send("progress_reset");
  },
  event: send,
};

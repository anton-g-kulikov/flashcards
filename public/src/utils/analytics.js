// Google Analytics (GA4 property "flashcards-ak-app", linked to the Firebase project): which
// features get used. Names, emails, account ids and words are never sent. Not loaded on
// localhost, so development stays out of the stats, nor on a device where the user turned it off
// (the cookie note at the foot of the pages, ui/analytics-note.js).
const MEASUREMENT_ID = "G-E0J0MDFKE6";
const OPT_OUT_KEY = "flashcards-analytics";
const development = ["localhost", "127.0.0.1"].includes(location.hostname);

function optedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "off";
  } catch (error) {
    return false;
  }
}

let active = false;
let loaded = false;

function load() {
  active = true;
  window[`ga-disable-${MEASUREMENT_ID}`] = false;
  if (loaded) return;
  loaded = true;
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

// Stops sending at once and removes Analytics' cookies (_ga, _ga_<id>), which it sets on the
// site's domain and every level above it
function unload() {
  active = false;
  window[`ga-disable-${MEASUREMENT_ID}`] = true;
  const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n.startsWith("_ga"));
  const parts = location.hostname.split(".");
  const domains = ["", ...parts.slice(0, -1).map((_, i) => `; domain=.${parts.slice(i).join(".")}`)];
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  }
}

if (!development && !optedOut()) load();

export function analyticsAllowed() {
  return !optedOut();
}

// The user's choice on this device: off stops and forgets Analytics, on starts it again
export function setAnalyticsAllowed(allowed) {
  try {
    if (allowed) localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, "off");
  } catch (error) {
    // Not remembered across visits, but it still applies now
  }
  if (!allowed) unload();
  else if (!development) load();
}

function send(name, params = {}) {
  if (active) window.gtag("event", name, params);
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

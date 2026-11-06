// The landing page's feature cards turn over like the app's flashcards: tap, Enter or Space. Each
// wiggles once when it has scrolled fully into view, which also says that it can be touched: on a
// phone there is no hover to show the "Tap to turn" hint. Tabs show the starter collections one
// language at a time; all of them stay in the HTML, for search engines.
import { languagePair } from "../core/card-data.js";
import { onActivate } from "../features/study/message-card.js";
import { I18n } from "./i18n.js";
import "./landing-demo.js";

const STAGGER_MS = 90; // cards side by side wiggle one after the other
const FULLY_SHOWN = 0.99; // not 1: a card fully on screen can measure a fraction less

const cards = document.querySelectorAll(".landing-card");

cards.forEach((card) => {
  onActivate(card, () => card.classList.toggle("flipped"));
});

const observer = new IntersectionObserver(
  (entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => {
        entry.target.style.animationDelay = `${index * STAGGER_MS}ms`;
        entry.target.classList.add("wiggle");
        observer.unobserve(entry.target);
      });
  },
  { threshold: FULLY_SHOWN }
);
[...cards, document.querySelector(".demo .flashcard")].forEach((card) => {
  const wrapper = card.parentElement;
  observer.observe(wrapper);
  // A finished animation would otherwise hold the wrapper still, and the demo card swipes
  wrapper.addEventListener("animationend", () => wrapper.classList.remove("wiggle"));
});

// One language's collections at a time. It opens on the one taught to speakers of the interface
// language, if there is one, until the visitor picks.
const groups = [...document.querySelectorAll(".starter-group")];
const pairs = groups.map((group) => group.dataset.language);
let picked = null;

const tabs = pairs.map((pair) => {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "chip-btn";
  tab.addEventListener("click", () => {
    picked = pair;
    showStarters();
  });
  return tab;
});
document.querySelector(".starter-tabs").append(...tabs);

function showStarters() {
  const shown = picked ?? pairs.find((pair) => languagePair(pair).translation === I18n.lang) ?? pairs[0];
  pairs.forEach((pair, index) => {
    const active = pair === shown;
    tabs[index].textContent = I18n.languageName(languagePair(pair).word);
    tabs[index].classList.toggle("active", active);
    tabs[index].setAttribute("aria-pressed", String(active));
    groups[index].hidden = !active;
  });
}

showStarters();
document.addEventListener("i18n-changed", showStarters);

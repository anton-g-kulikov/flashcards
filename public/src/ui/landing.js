// The landing page's feature cards turn over like the app's flashcards: tap, Enter or Space. Each
// wiggles once when it has scrolled fully into view, which also says that it can be touched: on a
// phone there is no hover to show the "Tap to turn" hint.
import { onActivate } from "../features/study/message-card.js";

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
cards.forEach((card) => observer.observe(card.parentElement));

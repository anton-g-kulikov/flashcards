// The landing page's feature cards turn over like the app's flashcards: tap, Enter or Space.
import { onActivate } from "../features/study/message-card.js";

document.querySelectorAll(".landing-card").forEach((card) => {
  onActivate(card, () => card.classList.toggle("flipped"));
});

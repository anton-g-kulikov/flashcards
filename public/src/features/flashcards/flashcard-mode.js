// Flashcards: the word on the front, its translation on the back. The deck is the study queue
// (due words, then new ones). "I know this!" moves the word up a box and it leaves the deck;
// "I don't know…" turns the card over, waits for a tap, and the word comes back after three
// other cards, as a missed word does in the quiz.
import { I18n } from "../../ui/i18n.js";
import { Analytics } from "../../utils/analytics.js";
import { el, onActivate, renderMessage } from "../study/message-card.js";
import { retryLater } from "../study/progress.js";

const FLIP_MS = 600; // the .flashcard transform transition in styles.css

export class FlashcardMode {
  // study: { cards, progress, changed(), caughtUpMessage() }
  constructor(study) {
    this.study = study;
    this.card = document.getElementById("flashcard");
    this.actions = document.getElementById("cardActions");
    this.deck = [];
    this.flipped = false;
    this.waitingForTap = false; // the back is showing after "I don't know"
    this.showingMessage = false;
    this.busy = false; // turning over to the next word
    this.flipTimer = null;

    onActivate(this.card, () => this.tapCard());
    document.getElementById("knowBtn").addEventListener("click", () => this.mark(true));
    document.getElementById("dontKnowBtn").addEventListener("click", () => this.mark(false));
  }

  get current() {
    return this.deck[0];
  }

  start() {
    this.deck = this.study.progress.studyQueue(this.study.cards);
    this.show();
  }

  // Shows the current word, front up. Also redraws it after a language switch.
  show() {
    clearTimeout(this.flipTimer);
    this.busy = false;
    this.flipped = false;
    this.waitingForTap = false;
    this.card.classList.remove("flipped");

    const card = this.current;
    if (!card) {
      this.showEnd();
      return;
    }
    this.showingMessage = false;
    this.actions.classList.remove("hidden");

    const front = el("div", "card-face card-front");
    front.append(el("div", "spanish-word", card.word));
    const back = el("div", "card-face card-back");
    back.append(el("div", "translation", card.translation || I18n.t("card.noTranslation")));
    this.card.replaceChildren(front, back);
  }

  // Nothing left to study now, or nothing to study at all
  showEnd() {
    this.showingMessage = true;
    this.actions.classList.add("hidden");
    if (this.study.cards.length === 0) {
      renderMessage(this.card, {
        title: I18n.t("flash.none.title"),
        hintHtml: I18n.t("flash.none.hint"),
      });
    } else {
      renderMessage(this.card, this.study.caughtUpMessage());
    }
    this.flipTimer = setTimeout(() => this.card.classList.add("flipped"), 2000);
  }

  tapCard() {
    if (this.showingMessage) {
      this.card.classList.toggle("flipped");
      return;
    }
    if (this.busy || !this.current) return;
    if (this.flipped && this.waitingForTap) {
      this.advance();
      return;
    }
    this.flipped = !this.flipped;
    this.card.classList.toggle("flipped", this.flipped);
  }

  mark(known) {
    const card = this.current;
    if (!card || this.busy || this.showingMessage) return;
    const { progress } = this.study;
    if (known) progress.right(card.id);
    else progress.wrong(card.id);
    Analytics.cardMarked(known);
    this.study.changed();

    if (this.flipped) {
      this.advance();
    } else if (known) {
      this.next();
    } else {
      // Show the translation; the next word comes on the next tap
      this.flipped = true;
      this.waitingForTap = true;
      this.card.classList.add("flipped");
    }
  }

  // Turns the card face down with its text cleared, so the next word's translation never shows
  // during the flip, then shows the next word.
  advance() {
    this.busy = true;
    this.card.querySelectorAll(".spanish-word, .translation").forEach((text) => {
      text.textContent = "";
    });
    this.flipped = false;
    this.waitingForTap = false;
    this.card.classList.remove("flipped");
    this.flipTimer = setTimeout(() => this.next(), FLIP_MS);
  }

  // A word still due (not known this time) comes back after a few cards; a known one leaves
  next() {
    const card = this.deck.shift();
    if (card && this.study.progress.needsStudy(card.id)) retryLater(this.deck, card);
    this.show();
  }
}

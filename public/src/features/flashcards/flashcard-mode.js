// Flashcards: the word on the front, its translation on the back. "I know this!" marks the word
// known and it leaves the deck; "I don't know…" turns the card over and waits for a tap before
// the next word. The deck is every unknown word, least recently seen first (roughly).
import { I18n } from "../../ui/i18n.js";
import { Analytics } from "../../utils/analytics.js";
import { weightedShuffle } from "../../utils/shuffle-utils.js";
import { el, onActivate, renderMessage } from "../study/message-card.js";

const FLIP_MS = 600; // the .flashcard transform transition in styles.css

export class FlashcardMode {
  // study: { cards, progress, changed() }
  constructor(study) {
    this.study = study;
    this.card = document.getElementById("flashcard");
    this.actions = document.getElementById("cardActions");
    this.deck = [];
    this.index = 0;
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
    return this.deck[this.index];
  }

  // A fresh deck of the unknown words. `firstId` (the quiz's last word) goes first.
  start(firstId) {
    const { cards, progress } = this.study;
    this.deck = weightedShuffle(progress.unknown(cards), progress.history);
    const first = this.deck.findIndex((card) => card.id === firstId);
    if (first > 0) this.deck.unshift(...this.deck.splice(first, 1));
    this.index = 0;
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

  // No words left: all learned, or nothing to study at all
  showEnd() {
    this.showingMessage = true;
    this.actions.classList.add("hidden");
    if (this.study.cards.length === 0) {
      renderMessage(this.card, {
        title: I18n.t("flash.none.title"),
        hintHtml: I18n.t("flash.none.hint"),
      });
    } else {
      renderMessage(this.card, {
        tone: "success",
        badge: I18n.t("flash.complete.badge"),
        title: I18n.t("flash.complete.title"),
        text: I18n.t("flash.complete.next"),
        hintHtml: I18n.t("flash.complete.hint"),
      });
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
    if (this.flipped) {
      this.study.progress.seen(this.current.id);
      this.study.changed();
    }
  }

  mark(known) {
    const card = this.current;
    if (!card || this.busy || this.showingMessage) return;
    const { progress } = this.study;
    if (known) progress.markKnown(card.id);
    else progress.markUnknown(card.id);
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

  next() {
    const { progress } = this.study;
    const card = this.current;
    if (card && progress.isKnown(card.id)) {
      // Known words leave the deck; the rest is reshuffled so no order can be learned
      this.deck.splice(this.index, 1);
      weightedShuffle(this.deck, progress.history);
      this.index = 0;
    } else if (this.deck.length > 0) {
      this.index = (this.index + 1) % this.deck.length;
    }
    this.show();
  }
}

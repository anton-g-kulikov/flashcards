// Flashcards: the word on the front, its translation on the back. The deck is the study queue
// (due words, then new ones). "I know this!" moves the word up a box and it leaves the deck;
// "I don't know…" turns the card over and becomes "Next" (a tap on the card works too), and the
// word comes back after three other cards, as a missed word does in the quiz. A card leaves to the
// right when known and to the left when not.
import { I18n } from "../../ui/i18n.js";
import { Analytics } from "../../utils/analytics.js";
import { el, onActivate, renderMessage } from "../study/message-card.js";
import { retryLater } from "../study/progress.js";

const SWIPE_MS = 280; // the .leaving-left/right transition in styles.css

export class FlashcardMode {
  // study: { cards, progress, changed(), caughtUpMessage() }
  constructor(study) {
    this.study = study;
    this.card = document.getElementById("flashcard");
    this.container = this.card.parentElement;
    this.actions = document.getElementById("cardActions");
    this.deck = [];
    this.flipped = false;
    this.waitingForTap = false; // the back is showing after "I don't know"
    this.showingMessage = false;
    this.busy = false; // turning over to the next word
    this.flipTimer = null;

    onActivate(this.card, () => this.tapCard());
    document.getElementById("knowBtn").addEventListener("click", () => this.mark(true));
    this.dontKnowBtn = document.getElementById("dontKnowBtn");
    this.dontKnowBtn.addEventListener("click", () => {
      if (this.busy) return;
      if (this.waitingForTap) this.leave("left");
      else this.mark(false);
    });
  }

  get current() {
    return this.deck[0];
  }

  start() {
    this.deck = this.study.progress.studyQueue(this.study.cards);
    this.show();
  }

  // After "I don't know" the translation is showing and the only step left is moving on, so the
  // button says that. The label follows data-i18n through language switches.
  setNextButton(on) {
    const key = on ? "card.next" : "card.dontKnow";
    this.dontKnowBtn.dataset.i18n = key;
    this.dontKnowBtn.querySelector("span").textContent = I18n.t(key);
    this.dontKnowBtn.classList.toggle("next-btn", on);
  }

  // Shows the current word, front up. Also redraws it after a language switch.
  show() {
    clearTimeout(this.flipTimer);
    this.busy = false;
    this.flipped = false;
    this.waitingForTap = false;
    this.setNextButton(false);
    this.resetCard();

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
      this.leave("left");
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

    if (known) {
      this.leave("right");
    } else if (this.flipped) {
      this.leave("left");
    } else {
      // Show the translation; the next word comes on the next tap
      this.flipped = true;
      this.waitingForTap = true;
      this.setNextButton(true);
      this.card.classList.add("flipped");
    }
  }

  // Sends the card off the screen, then brings in the next word
  leave(direction) {
    this.busy = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.next();
      return;
    }
    this.container.classList.add(`leaving-${direction}`);
    this.flipTimer = setTimeout(() => this.next(), SWIPE_MS);
  }

  // Front up at once, with no flip to watch: a card that left the screen comes back as the next
  // word, which fades in, and its translation must never show on the way
  resetCard() {
    const { classList } = this.container;
    const left = classList.contains("leaving-left") || classList.contains("leaving-right");
    classList.remove("leaving-left", "leaving-right", "arriving");
    this.card.classList.add("no-flip");
    this.card.classList.remove("flipped");
    void this.card.offsetWidth; // applies the change before the flip transition returns
    this.card.classList.remove("no-flip");
    if (left) classList.add("arriving");
  }

  // A word still due (not known this time) comes back after a few cards; a known one leaves
  next() {
    const card = this.deck.shift();
    if (card && this.study.progress.needsStudy(card.id)) retryLater(this.deck, card);
    this.show();
  }
}

// The study page: flashcards and the quiz over every word in the collections switched on in
// My Cards, with spaced repetition: what is due comes first, then new words. Progress (each
// word's box and due date) is saved to the account.
import "./core/page.js";
import { studyCard } from "./core/card-data.js";
import { Cloud } from "./core/cloud.js";
import { I18n } from "./ui/i18n.js";
import { AuthGate } from "./ui/auth-gate.js";
import "./ui/landing.js";
import { confirmOnSecondTap } from "./ui/confirm-button.js";
import { Analytics } from "./utils/analytics.js";
import { initInstallPrompt } from "./utils/pwa-installer.js";
import { studyDirection } from "./features/study/direction.js";
import { initialMode } from "./features/study/mode.js";
import { Progress } from "./features/study/progress.js";
import { FlashcardMode } from "./features/flashcards/flashcard-mode.js";
import { QuizMode } from "./features/flashcards/quiz-mode.js";

const SAVE_DELAY_MS = 2000;
const MODE_KEY = "flashcards-mode"; // the mode last chosen, per device

function savedMode() {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch (error) {
    return null; // Storage blocked: the default is fine
  }
}

function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch (error) {
    // Not remembered, but the choice still applies now
  }
}

// Marks the mode's button and shows its section
function showMode(mode) {
  document.querySelectorAll(".app-container .mode-btn").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("flashcardMode").classList.toggle("hidden", mode !== "flashcard");
  document.getElementById("quizMode").classList.toggle("hidden", mode !== "quiz");
}

class StudyPage {
  // collections: all of them; words: the stored cards of those switched on
  constructor(collections, words, progress, mode) {
    this.collections = collections;
    this.words = words;
    this.cards = this.studyCards();
    this.progress = progress;
    this.mode = mode;
    this.saveTimer = null;

    this.flashcards = new FlashcardMode(this);
    this.quiz = new QuizMode(this);

    document.querySelectorAll(".app-container .mode-btn").forEach((button) => {
      button.addEventListener("click", () => this.setMode(button.dataset.mode, { byUser: true }));
    });
    const resetButton = document.getElementById("resetProgressBtn");
    resetButton.addEventListener("click", () => this.reset(resetButton));
    this.directionButton = document.getElementById("directionBtn");
    this.directionButton.addEventListener("click", () => this.swapDirection());

    document.addEventListener("i18n-changed", () => {
      this.showCounts();
      this.showDirection();
      if (this.mode === "flashcard") this.flashcards.show();
      else this.quiz.refresh();
    });

    // Save pending progress when the page is hidden or closed
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.save();
    });
    window.addEventListener("pagehide", () => this.save());
  }

  studyCards() {
    const byId = new Map(this.collections.map((c) => [c.id, c]));
    return this.words.map((word) => studyCard(word, byId.get(word.collectionId)));
  }

  // The collections being studied: the ones the direction switch acts on
  get studied() {
    const ids = new Set(this.words.map((word) => word.collectionId));
    return this.collections.filter((c) => ids.has(c.id));
  }

  // "Spanish → English", or "Word → Translation" unless all the collections share a language pair
  showDirection() {
    const { first, second, mixed } = studyDirection(this.studied);
    const name = ({ side, language }) =>
      language ? I18n.languageName(language) : I18n.t(side === "word" ? "words.wordPlaceholder" : "words.translationPlaceholder");
    this.directionButton.textContent = `${name(first)} ${mixed ? "⇄" : "→"} ${name(second)}`;
    this.directionButton.title = I18n.t("study.swapDirection");
    this.directionButton.classList.toggle("hidden", !this.words.some((word) => word.translation));
  }

  // The same setting as the arrow in My Cards, for every collection being studied at once. A mix
  // of directions all goes the other way round. If saving fails, the cards turn back.
  async swapDirection() {
    const reversed = !studyDirection(this.studied).reversed;
    const changing = this.studied.filter((c) => !c.reversed === reversed);
    const apply = (value) => {
      changing.forEach((c) => (c.reversed = value));
      this.cards = this.studyCards();
      this.showDirection();
      this.restart();
    };
    apply(reversed);
    try {
      await Promise.all(changing.map((c) => Cloud.setCollectionReversed(c.id, reversed)));
    } catch (error) {
      console.error("Error saving the direction:", error);
      apply(!reversed);
    }
  }

  restart() {
    if (this.mode === "flashcard") this.flashcards.start();
    else this.quiz.start();
  }

  start() {
    this.showCounts();
    this.showDirection();
    this.renderStats();
    Analytics.studyStart(this.mode, this.cards.length, this.progress.stats(this.cards).due);
    this.setMode(this.mode);
  }

  setMode(mode, { byUser = false } = {}) {
    this.mode = mode;
    showMode(mode);

    if (byUser) {
      saveMode(mode);
      Analytics.modeSwitch(mode);
    } else {
      Analytics.modeStarted(mode);
    }

    if (mode === "flashcard") {
      this.quiz.stop();
      this.flashcards.start();
    } else {
      this.quiz.start();
    }
  }

  // Called by the modes after every change to progress
  changed() {
    this.renderStats();
    clearTimeout(this.saveTimer);
    // Answers come in quick bursts: write at most once every couple of seconds
    this.saveTimer = setTimeout(() => this.save(), SAVE_DELAY_MS);
  }

  save() {
    clearTimeout(this.saveTimer);
    if (!this.progress.hasChanges()) return;
    const changes = this.progress.takeChanges();
    Cloud.saveProgressChanges(changes).catch((error) => {
      // Kept for the next save, e.g. once the connection is back
      this.progress.restoreChanges(changes);
      console.error("Error saving progress:", error);
    });
  }

  // Makes the words being studied new again; other collections keep their progress
  reset(button) {
    if (!confirmOnSecondTap(button, I18n.t("progress.resetConfirm"))) return;
    this.progress.reset(this.cards.map((card) => card.id));
    this.changed();
    this.save();
    Analytics.progressReset();
    this.restart();
  }

  // Due (to study now, new words included) · Learning · Mastered; the bar is the average box
  renderStats() {
    const { due, learning, mastered, level } = this.progress.stats(this.cards);
    document.getElementById("dueCards").textContent = due;
    document.getElementById("learningCards").textContent = learning;
    document.getElementById("masteredCards").textContent = mastered;
    document.getElementById("progressFill").style.width = `${level * 100}%`;
  }

  // Shown by both modes when nothing is left to study now
  caughtUpMessage() {
    const next = this.progress.nextDue(this.cards);
    return {
      tone: "success",
      badge: I18n.t("srs.caughtUp.badge"),
      title: I18n.t("srs.caughtUp.title"),
      text: next ? I18n.t("srs.caughtUp.next", { when: whenText(next) }) : undefined,
      hintHtml: I18n.t("srs.caughtUp.hint"),
    };
  }

  showCounts() {
    const count = this.cards.length;
    document.getElementById("emptyCollectionNotice").classList.toggle("hidden", count > 0);
    document.getElementById("footer-word-count").textContent = I18n.t("footer.words", { count });
  }
}

// "in 3 hours", "tomorrow", "in 16 days", in the interface language
function whenText(time) {
  const format = new Intl.RelativeTimeFormat(I18n.lang, { numeric: "auto" });
  const minutes = Math.max(1, Math.round((time - Date.now()) / 60000));
  if (minutes < 60) return format.format(minutes, "minute");
  if (minutes < 24 * 60) return format.format(Math.round(minutes / 60), "hour");
  return format.format(Math.round(minutes / (24 * 60)), "day");
}

initInstallPrompt();

// Right away, so the page doesn't show the default mode first while the words load
const startMode = initialMode(new URLSearchParams(location.search).get("mode"), savedMode());
showMode(startMode);

AuthGate.onSignedIn(async () => {
  const [{ collections, cards: allCards }, saved] = await Promise.all([
    Cloud.loadAll(I18n.t("collections.default")),
    Cloud.loadProgress(),
  ]);

  // Every word in the collections switched on (cards whose collection is gone count as on, so
  // nothing silently disappears)
  const inactive = new Set(collections.filter((c) => !c.active).map((c) => c.id));
  const words = allCards.filter((card) => !inactive.has(card.collectionId));

  const progress = new Progress(saved);
  const page = new StudyPage(collections, words, progress, startMode);
  // Progress of cards deleted since (in any collection) is dropped from the saved record
  if (progress.prune(new Set(allCards.map((card) => card.id)))) page.save();
  page.start();
});

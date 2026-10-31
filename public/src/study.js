// The study page: flashcards and the quiz over every word in the collections switched on in
// My Cards. Progress (known words, when each was last seen) is saved to the account.
import "./core/page.js";
import { Cloud } from "./core/cloud.js";
import { I18n } from "./ui/i18n.js";
import { AuthGate } from "./ui/auth-gate.js";
import { confirmOnSecondTap } from "./ui/confirm-button.js";
import { Analytics } from "./utils/analytics.js";
import { initInstallPrompt } from "./utils/pwa-installer.js";
import { Progress } from "./features/study/progress.js";
import { FlashcardMode } from "./features/flashcards/flashcard-mode.js";
import { QuizMode } from "./features/flashcards/quiz-mode.js";

const SAVE_DELAY_MS = 2000;

class StudyPage {
  constructor(cards, progress) {
    this.cards = cards;
    this.progress = progress;
    this.mode = "quiz";
    this.saveTimer = null;

    this.flashcards = new FlashcardMode(this);
    this.quiz = new QuizMode(this);

    document.querySelectorAll(".mode-btn").forEach((button) => {
      button.addEventListener("click", () => this.setMode(button.dataset.mode, { byUser: true }));
    });
    const resetButton = document.getElementById("resetProgressBtn");
    resetButton.addEventListener("click", () => this.reset(resetButton));

    document.addEventListener("i18n-changed", () => {
      this.showCounts();
      if (this.mode === "flashcard") this.flashcards.show();
      else this.quiz.refresh();
    });

    // Save pending progress when the page is hidden or closed
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.save();
    });
    window.addEventListener("pagehide", () => this.save());
  }

  start() {
    this.showCounts();
    this.renderStats();
    Analytics.studyStart(this.mode, this.cards.length, this.progress.knownCount(this.cards));
    this.setMode(this.mode);
  }

  // Quiz is the default; flashcards take over for the quiz's last word (`firstId`)
  setMode(mode, { byUser = false, firstId } = {}) {
    this.mode = mode;
    document.querySelectorAll(".mode-btn").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.getElementById("flashcardMode").classList.toggle("hidden", mode !== "flashcard");
    document.getElementById("quizMode").classList.toggle("hidden", mode !== "quiz");

    if (byUser) Analytics.modeSwitch(mode);
    else Analytics.modeStarted(mode);

    if (mode === "flashcard") {
      this.quiz.stop();
      this.flashcards.start(firstId);
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

  // Marks the words being studied unknown again; other collections keep their progress
  reset(button) {
    if (!confirmOnSecondTap(button, I18n.t("progress.resetConfirm"))) return;
    this.progress.reset(this.cards.map((card) => card.id));
    this.changed();
    this.save();
    Analytics.progressReset();
    if (this.mode === "flashcard") this.flashcards.start();
    else this.quiz.start();
  }

  renderStats() {
    const total = this.cards.length;
    const known = this.progress.knownCount(this.cards);
    document.getElementById("totalCards").textContent = total;
    document.getElementById("knownCards").textContent = known;
    document.getElementById("unknownCards").textContent = total - known;
    document.getElementById("progressFill").style.width = `${total ? (known / total) * 100 : 0}%`;
  }

  showCounts() {
    const count = this.cards.length;
    document.getElementById("emptyCollectionNotice").classList.toggle("hidden", count > 0);
    document.getElementById("footer-word-count").textContent = I18n.t("footer.words", { count });
  }
}

initInstallPrompt();

AuthGate.onSignedIn(async () => {
  const [{ collections, cards: allCards }, saved] = await Promise.all([
    Cloud.loadAll(I18n.t("collections.default")),
    Cloud.loadProgress(),
  ]);

  // Every word in the collections switched on (cards whose collection is gone count as on, so
  // nothing silently disappears)
  const inactive = new Set(collections.filter((c) => !c.active).map((c) => c.id));
  const cards = allCards
    .filter((card) => !inactive.has(card.collectionId))
    .map(({ id, word, translation }) => ({ id, word, translation }));

  const progress = new Progress(saved);
  const page = new StudyPage(cards, progress);
  // Progress of cards deleted since (in any collection) is dropped from the saved record
  if (progress.prune(new Set(allCards.map((card) => card.id)))) page.save();
  page.start();
});

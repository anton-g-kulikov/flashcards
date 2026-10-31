// Quiz: "What does <word> mean?" with up to four translations to choose from. Right on the first
// try, the word is known and leaves the quiz; a wrong answer turns that card over to show whose
// translation it is, and the word stays unknown. The last word is studied as a flashcard.
import { I18n } from "../../ui/i18n.js";
import { Analytics } from "../../utils/analytics.js";
import { weightedShuffle } from "../../utils/shuffle-utils.js";
import { el, showMessageCard } from "../study/message-card.js";
import { nextStep, pickOptions, pickQuestion, quizPool, recordAnswer } from "../study/quiz-logic.js";

const CHECK_ICON = "M20 6L9 17l-5-5";
const CROSS_ICON = "M18 6L6 18M6 6l12 12";

export class QuizMode {
  // study: { cards, progress, changed(), setMode(mode, options) }
  constructor(study) {
    this.study = study;
    this.questionEl = document.getElementById("quizQuestion");
    this.optionsEl = document.getElementById("quizOptions");
    this.pool = [];
    this.current = null; // the card being asked about
    this.firstTry = true;
    this.answered = false;
    this.timers = [];
  }

  later(callback, ms) {
    this.timers.push(setTimeout(callback, ms));
  }

  // Cancels pending steps (the next question, the switch to flashcards) when leaving the quiz
  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.current = null;
    this.answered = false;
  }

  start() {
    this.stop();
    const { cards, progress } = this.study;
    this.pool = weightedShuffle(quizPool(cards, progress), progress.history);
    if (this.pool.length < 2) {
      this.showMessage(
        {
          tone: "warning",
          title: I18n.t("quiz.needTwo.title"),
          text: I18n.t("quiz.needTwo.count", { count: this.pool.length }),
          hintHtml: I18n.t("quiz.needTwo.hint"),
        },
        2000
      );
      return;
    }
    this.ask();
  }

  // After a language switch: the question is reworded, everything else stays
  refresh() {
    if (this.current) this.renderQuestion();
    else this.start();
  }

  ask() {
    const correct = pickQuestion(this.pool);
    const options = pickOptions(correct, this.pool);
    if (options.length < 2) {
      this.showMessage(
        {
          tone: "warning",
          badge: I18n.t("quiz.notUnique.badge"),
          title: I18n.t("quiz.notUnique.title"),
          text: I18n.t("quiz.notUnique.next"),
          hintHtml: I18n.t("quiz.notUnique.hint"),
        },
        2000
      );
      return;
    }

    this.current = correct;
    this.firstTry = true;
    this.answered = false;
    this.study.progress.seen(correct.id);
    this.study.changed();
    this.renderQuestion();
    this.optionsEl.replaceChildren(...options.map((option) => this.renderOption(option)));
  }

  renderQuestion() {
    const [before, after = ""] = I18n.t("quiz.question").split("{word}");
    const word = el("span", "spanish-word spanish-highlight", this.current.word);
    this.questionEl.replaceChildren(before, word, after);
  }

  // An option is a button that turns over to show the answer. Card text is user data (typed or
  // imported): always text, never HTML.
  renderOption(option) {
    const container = el("div", "quiz-card-container");
    const button = el("button", "quiz-card");
    button.type = "button";
    const front = el("span", "quiz-card-face quiz-card-front");
    front.append(el("span", "quiz-option-text", option.translation.trim()));
    const back = el("span", "quiz-card-face quiz-card-back");
    back.setAttribute("aria-live", "polite");
    button.append(front, back);
    button.addEventListener("click", () => this.choose(option, button));
    container.append(button);
    return container;
  }

  choose(option, button) {
    if (this.answered || button.classList.contains("flipped")) return;
    const { progress } = this.study;
    const correct = option.id === this.current.id;
    Analytics.quizAnswer(correct);

    const back = button.querySelector(".quiz-card-back");
    back.classList.add(correct ? "correct" : "wrong");
    renderAnswer(back, correct ? CHECK_ICON : CROSS_ICON, option.translation, option.word, correct);
    button.classList.add("flipped");
    button.setAttribute("aria-disabled", "true");

    if (!correct) {
      this.firstTry = false;
      progress.seen(option.id);
      this.study.changed();
      return;
    }

    this.answered = true;
    this.pool = recordAnswer(progress, this.pool, option.id, this.firstTry);
    weightedShuffle(this.pool, progress.history);
    this.study.changed();
    this.later(() => this.afterAnswer(), 750);
  }

  afterAnswer() {
    const step = nextStep(this.pool);
    if (step === "ask") {
      this.ask();
    } else if (step === "last") {
      this.showLast(this.pool[0]);
    } else {
      this.showMessage(
        {
          tone: "success",
          badge: I18n.t("quiz.complete.badge"),
          title: I18n.t("quiz.complete.title"),
          text: I18n.t("quiz.complete.next"),
          hintHtml: I18n.t("quiz.complete.hint"),
        },
        2000
      );
    }
  }

  // One word left: say so, then study it as a flashcard
  showLast(card) {
    this.showMessage(
      {
        tone: "accent",
        badge: I18n.t("quiz.last.badge"),
        title: I18n.t("quiz.last.title"),
        text: I18n.t("quiz.last.next"),
        hintHtml: I18n.t("quiz.last.hint", { word: I18n.escape(card.word) }),
      },
      1000
    );
    this.later(() => this.study.setMode("flashcard", { firstId: card.id }), 3000);
  }

  showMessage(message, flipAfter) {
    this.current = null;
    this.questionEl.textContent = "";
    showMessageCard(this.optionsEl, message, flipAfter);
  }
}

// The back of an answer card: a check or cross icon, the translation and the word. The icon is
// fixed markup; the translation and word are user data, so they go in as text only.
function renderAnswer(back, iconPath, translation, word, hideWordOnMobile) {
  back.innerHTML = `
    <span class="quiz-card-translation">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        aria-hidden="true">
        <path d="${iconPath}"/>
      </svg>
      <span></span>
    </span>
    <span class="quiz-card-word"></span>`;
  back.querySelector(".quiz-card-translation span").textContent = translation;
  const wordEl = back.querySelector(".quiz-card-word");
  wordEl.textContent = word;
  if (hideWordOnMobile) wordEl.classList.add("mobile-hidden");
}

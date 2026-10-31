// Quiz: "What does <word> mean?" with up to four translations to choose from. It asks about
// the study queue (due words, then new ones); the options come from every word with a
// translation. Right on the first try moves the word up a box; a wrong answer turns that card
// over to show whose translation it is, drops the word to box 1, and it comes back later.
import { I18n } from "../../ui/i18n.js";
import { Analytics } from "../../utils/analytics.js";
import { el, showMessageCard } from "../study/message-card.js";
import {
  distinctTranslations,
  hasTranslation,
  pickOptions,
  pickQuestion,
  quizPool,
} from "../study/quiz-logic.js";

const CHECK_ICON = "M20 6L9 17l-5-5";
const CROSS_ICON = "M18 6L6 18M6 6l12 12";

export class QuizMode {
  // study: { cards, progress, changed(), caughtUpMessage() }
  constructor(study) {
    this.study = study;
    this.questionEl = document.getElementById("quizQuestion");
    this.optionsEl = document.getElementById("quizOptions");
    this.current = null; // the card being asked about
    this.lastId = null; // the card asked before, not asked twice in a row
    this.firstTry = true;
    this.answered = false;
    this.timers = [];
  }

  later(callback, ms) {
    this.timers.push(setTimeout(callback, ms));
  }

  // Cancels a pending next question when leaving the quiz
  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.current = null;
    this.answered = false;
  }

  start() {
    this.stop();
    this.lastId = null;
    this.ask();
  }

  // After a language switch: the question is reworded, everything else stays
  refresh() {
    if (this.current) this.renderQuestion();
    else this.start();
  }

  ask() {
    const { cards, progress } = this.study;
    const translations = distinctTranslations(cards);
    if (translations < 2) {
      this.showMessage(
        {
          tone: "warning",
          title: I18n.t("quiz.needTwo.title"),
          text: I18n.t("quiz.needTwo.count", { count: translations }),
          hintHtml: I18n.t("quiz.needTwo.hint"),
        },
        2000
      );
      return;
    }

    const pool = quizPool(cards, progress);
    if (pool.length === 0) {
      const untranslated = progress.studyQueue(cards).length > 0;
      this.showMessage(
        untranslated
          ? {
              tone: "warning",
              title: I18n.t("quiz.untranslated.title"),
              hintHtml: I18n.t("quiz.untranslated.hint"),
            }
          : this.study.caughtUpMessage(),
        2000
      );
      return;
    }

    const correct = pickQuestion(pool, this.lastId);
    this.current = correct;
    this.lastId = correct.id;
    this.firstTry = true;
    this.answered = false;
    this.renderQuestion();
    const options = pickOptions(correct, cards.filter(hasTranslation));
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
      if (this.firstTry) {
        progress.wrong(this.current.id);
        this.study.changed();
      }
      this.firstTry = false;
      return;
    }

    this.answered = true;
    if (this.firstTry) {
      progress.right(this.current.id);
      this.study.changed();
    }
    this.later(() => this.ask(), 750);
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

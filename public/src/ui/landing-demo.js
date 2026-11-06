// The landing page's demo: the app's own Flash Mode and Quiz Mode on a few words held in memory,
// so visitors can try both without an account. Nothing is saved or counted in analytics, and
// switching mode or language starts over.
import { demoCards } from "../features/study/demo-words.js";
import { Progress } from "../features/study/progress.js";
import { FlashcardMode } from "../features/flashcards/flashcard-mode.js";
import { QuizMode } from "../features/flashcards/quiz-mode.js";
import { AuthGate } from "./auth-gate.js";
import { I18n } from "./i18n.js";

const demo = document.querySelector(".demo");
const buttons = demo.querySelectorAll(".mode-btn");
const flashRoot = demo.querySelector(".demo-flash");
const quizRoot = demo.querySelector(".demo-quiz");

const study = {
  demo: true,
  cards: [],
  progress: new Progress(),
  changed() {},
  // The study modes show this when nothing is left to study: here, the way in
  caughtUpMessage() {
    return {
      tone: "success",
      title: I18n.t("landing.demo.done"),
      hintHtml: `<p>${I18n.t("landing.demo.next")}</p>
        <button type="button" class="primary-btn demo-signin">${I18n.t("auth.signIn")}</button>`,
    };
  },
};

const flashcards = new FlashcardMode(study, flashRoot);
const quiz = new QuizMode(study, quizRoot);
let mode = "flashcard";

function start() {
  study.cards = demoCards(I18n.lang);
  study.progress = new Progress();
  const flash = mode === "flashcard";
  buttons.forEach((button) => {
    const active = button.dataset.demo === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  flashRoot.classList.toggle("hidden", !flash);
  quizRoot.classList.toggle("hidden", flash);
  demo.querySelectorAll(".demo-help").forEach((help) => {
    help.classList.toggle("hidden", help.dataset.demo !== mode);
  });
  if (flash) {
    quiz.stop();
    flashcards.start();
  } else {
    quiz.start();
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.demo;
    start();
  });
});

// In the capture phase: the button sits on a card, which would turn over too
demo.addEventListener(
  "click",
  (event) => {
    if (!event.target.closest(".demo-signin")) return;
    event.stopPropagation();
    AuthGate.signIn();
  },
  true
);

document.addEventListener("i18n-changed", start);
start();

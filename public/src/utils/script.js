// Flashcards - Main Application Entry Point

// Global instance
let vocabApp;

// Start the application once the user is signed in and their collection is loaded
AuthGate.onSignedIn(async function () {
  const [cards, progress] = await Promise.all([
    window.Cloud.loadCards(),
    window.Cloud.loadProgress(),
  ]);
  window.vocabularyData = cards;
  window.initialProgress = progress;

  window.vocabApp = new window.DGTVocabulary();
  console.log(`DGTVocabulary app initialized with ${cards.length} cards`);

  const emptyNotice = document.getElementById("emptyCollectionNotice");
  if (emptyNotice) emptyNotice.classList.toggle("hidden", cards.length > 0);
  const wordCount = document.getElementById("footer-word-count");
  const showWordCount = () => {
    if (wordCount) {
      wordCount.textContent = I18n.t("footer.words", { count: cards.length });
    }
  };
  showWordCount();

  // Switching the interface language redraws the footer and the current card or question
  document.addEventListener("i18n-changed", () => {
    showWordCount();
    if (window.VersionSync) window.VersionSync.syncVersions();
    if (window.vocabApp.currentMode === "flashcard") {
      window.vocabApp.flashcardMode.showCurrentCard();
    } else {
      window.vocabApp.quizMode.startQuiz();
    }
  });

  // Save pending progress when the page is hidden or closed
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") window.vocabApp.flushProgress();
  });
  window.addEventListener("pagehide", () => window.vocabApp.flushProgress());

  // Quiz mode is the default: start it now that the cards are here
  if (window.vocabApp.currentMode === "quiz" && window.vocabApp.quizMode) {
    window.vocabApp.quizMode.startQuiz();
  }
});

// Global functions for UI interaction
function markCard(isKnown) {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.markCard(isKnown);
  }
}

function flipCard() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.flipCard();
  }
}

function nextCard() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.nextCard();
  }
}

function previousCard() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.previousCard();
  }
}

// Toggle between showing all cards vs unknown only
function toggleShowAllCards() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.showingAllCards =
      !window.vocabApp.flashcardMode.showingAllCards;
    window.vocabApp.flashcardMode.updateToggleButton();

    // Update current cards based on new toggle state
    window.vocabApp.updateCurrentCards();
    window.vocabApp.updateStats();
    window.vocabApp.showCurrentCard();
  }
}

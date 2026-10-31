// Flashcards - Main Application Entry Point

// Global instance
let vocabApp;

// Start the application once the user is signed in and their collections are loaded
AuthGate.onSignedIn(async function () {
  const [collections, allCards, progress] = await Promise.all([
    window.Cloud.loadCollections(I18n.t("collections.default")),
    window.Cloud.loadCards(),
    window.Cloud.loadProgress(),
  ]);
  window.allCardIds = new Set(allCards.map((card) => card.id));
  window.initialProgress = progress;

  // Study every word in the collections switched on in My Words (cards whose collection is
  // gone count as on, so nothing silently disappears)
  const inactive = new Set(collections.filter((c) => !c.active).map((c) => c.id));
  window.vocabularyData = allCards.filter((card) => !inactive.has(card.collectionId));

  const emptyNotice = document.getElementById("emptyCollectionNotice");
  const wordCount = document.getElementById("footer-word-count");
  const showCounts = () => {
    const count = window.vocabularyData.length;
    if (emptyNotice) emptyNotice.classList.toggle("hidden", count > 0);
    if (wordCount) wordCount.textContent = I18n.t("footer.words", { count });
  };

  window.vocabApp = new window.DGTVocabulary();
  console.log(`DGTVocabulary app initialized with ${window.vocabularyData.length} cards`);
  showCounts();

  // Switching the interface language redraws the footer and the current card or question
  document.addEventListener("i18n-changed", () => {
    showCounts();
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

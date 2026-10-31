// Reset progress utility

class ResetProgress {
  static resetAllProgress(button) {
    console.log("Reset progress button clicked...");

    // Ask for a second tap on the button before wiping progress
    if (button && !window.confirmOnSecondTap(button, "Tap again to reset all progress")) {
      return;
    }

    console.log("Resetting progress...");

    try {
      // Clear localStorage data
      localStorage.removeItem("vocabProgress");
      localStorage.removeItem("knownCards");
      localStorage.removeItem("unknownCards");
      localStorage.removeItem("dgt-vocab-progress");
      localStorage.removeItem("dgt-vocab-known");
      localStorage.removeItem("dgt-vocab-unknown");

      // Reset vocabApp progress if available
      if (window.vocabApp) {
        // Clear the Sets - check if they exist first
        if (window.vocabApp.knownCards) {
          window.vocabApp.knownCards.clear();
        }
        if (window.vocabApp.unknownCards) {
          window.vocabApp.unknownCards.clear();
        }
        if (window.vocabApp.knownCardsSet) {
          window.vocabApp.knownCardsSet.clear();
        }
        if (window.vocabApp.unknownCardsSet) {
          window.vocabApp.unknownCardsSet.clear();
        }

        // Persist the reset to the signed-in user's progress
        window.vocabApp.saveProgress();
        window.vocabApp.flushProgress();

        // Reset current card index
        window.vocabApp.currentCardIndex = 0;

        // Reset quiz state - check if properties exist first
        if (window.vocabApp.quizMode) {
          if (window.vocabApp.quizMode.currentQuestion !== undefined) {
            window.vocabApp.quizMode.currentQuestion = null;
          }
          if (
            window.vocabApp.quizMode.answeredQuestions &&
            typeof window.vocabApp.quizMode.answeredQuestions.clear ===
              "function"
          ) {
            window.vocabApp.quizMode.answeredQuestions.clear();
          }
          if (window.vocabApp.quizMode.currentQuestionIndex !== undefined) {
            window.vocabApp.quizMode.currentQuestionIndex = 0;
          }
          window.vocabApp.quizMode.quizScore = 0;
          window.vocabApp.quizMode.quizTotal = 0;
        }

        // Update current cards and stats
        window.vocabApp.updateCurrentCards();
        if (window.vocabApp.statsManager) {
          window.vocabApp.statsManager.updateStats();
        }

        // Track progress reset (only if Analytics is available)
        if (
          window.Analytics &&
          typeof window.Analytics.trackProgress === "function"
        ) {
          window.Analytics.trackProgress("reset");
        }

        // Get total cards count for proper unknown count
        const totalCards = window.vocabApp.currentCards
          ? window.vocabApp.currentCards.length
          : 0;

        // Reset UI elements with correct values
        ResetProgress.updateUIElements(totalCards);

        // Restart the current mode after reset
        if (
          window.vocabApp.currentMode === "flashcard" &&
          window.vocabApp.flashcardMode
        ) {
          window.vocabApp.flashcardMode.showCurrentCard();
        } else if (
          window.vocabApp.currentMode === "quiz" &&
          window.vocabApp.quizMode
        ) {
          // Restart quiz mode after reset
          setTimeout(() => {
            window.vocabApp.quizMode.startQuiz();
          }, 100);
        }
      } else {
        // Fallback if vocabApp not ready - try to get total from UI
        const totalCardsEl = document.getElementById("totalCards");
        const totalCards = totalCardsEl
          ? parseInt(totalCardsEl.textContent) || 0
          : 0;

        // Reset UI elements directly
        ResetProgress.updateUIElements(totalCards);
      }

      console.log("Progress reset complete");
    } catch (error) {
      console.error("Error resetting progress:", error);
      alert("There was an error resetting progress. Please try again.");
    }
  }

  static updateUIElements(totalCards) {
    const knownCardsEl = document.getElementById("knownCards");
    const unknownCardsEl = document.getElementById("unknownCards");
    const currentCardEl = document.getElementById("currentCard");
    const progressFillEl = document.getElementById("progressFill");

    if (knownCardsEl) knownCardsEl.textContent = "0";
    if (unknownCardsEl) unknownCardsEl.textContent = totalCards.toString();
    if (currentCardEl) currentCardEl.textContent = "1";
    if (progressFillEl) progressFillEl.style.width = "0%";
  }
}

// Make ResetProgress available globally
window.ResetProgress = ResetProgress;

// Global resetProgress function for backward compatibility
window.resetProgress = function (button) {
  ResetProgress.resetAllProgress(button);
};

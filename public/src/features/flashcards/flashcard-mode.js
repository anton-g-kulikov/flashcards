// Flashcard mode functionality

class FlashcardMode {
  constructor(vocabApp) {
    this.vocabApp = vocabApp;
    this.isFlipped = false;
    this.showingAllCards = false;
    this.waitingForCardClick = false;
  }

  // Use shared aggressive shuffle utility
  aggressiveShuffleForFlashcards(array) {
    if (!window.ShuffleUtils) {
      console.warn("ShuffleUtils not loaded, falling back to basic shuffle");
      // Fallback to basic Fisher-Yates if utility not loaded
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    return window.ShuffleUtils.aggressiveShuffle(array, this.vocabApp);
  }

  showCurrentCard() {
    // Make sure we're using the current filtered cards
    if (this.vocabApp.currentCards.length === 0) {
      // Refresh cards using the proper filtering method
      this.vocabApp.updateCurrentCards();
      if (this.vocabApp.currentCards.length === 0) {
        this.showNoCardsMessage();
        return;
      }
    }

    if (this.vocabApp.currentIndex >= this.vocabApp.currentCards.length) {
      this.vocabApp.currentIndex = 0;
    }

    const card = this.vocabApp.currentCards[this.vocabApp.currentIndex];
    if (!card) {
      this.showNoCardsMessage();
      return;
    }

    // Reset state when showing a new card
    this.waitingForCardClick = false;
    this.isFlipped = false;

    const flashcard = document.getElementById("flashcard");
    if (flashcard) {
      // Ensure card is fully visible
      flashcard.style.opacity = "";
      flashcard.style.visibility = "";
      flashcard.style.transition = "";

      // Reset flip state
      flashcard.classList.remove("flipped");

      // Display the new card content
      this.displayCard(card);
    } else {
      this.displayCard(card);
    }
  }

  displayCard(card) {
    const flashcard = document.getElementById("flashcard");
    if (!flashcard) return;

    // Show the action buttons for regular cards
    const cardActions = document.querySelector(".card-actions");
    if (cardActions) {
      cardActions.style.display = "flex";
    }

    // Ensure completely clean slate - this should already be done by showCurrentCard()
    // but adding as extra safety
    this.isFlipped = false;
    flashcard.classList.remove("flipped");
    flashcard.innerHTML = "";

    // Create front face
    const frontFace = document.createElement("div");
    frontFace.className = "card-face card-front";

    // Add Spanish word
    const spanishWord = document.createElement("div");
    spanishWord.className = "spanish-word";
    spanishWord.textContent = card.word || "No word available";
    frontFace.appendChild(spanishWord);

    // Create back face
    const backFace = document.createElement("div");
    backFace.className = "card-face card-back";

    // Add translation based on current language
    const translation = document.createElement("div");
    translation.className = "translation";
    translation.textContent = card.translation || I18n.t("card.noTranslation");
    backFace.appendChild(translation);

    // Add example if available
    if (card.example) {
      const example = document.createElement("div");
      example.className = "example";
      example.textContent = card.example;
      backFace.appendChild(example);
    }

    // Append faces to flashcard
    flashcard.appendChild(frontFace);
    flashcard.appendChild(backFace);

    // Add click handler for flipping
    flashcard.onclick = () => this.flipCard();
  }

  flipCard() {
    const flashcard = document.getElementById("flashcard");
    if (!flashcard) return;

    // If card is currently showing back side and user clicks on it,
    // and we got here via "I don't know this" button, advance to next card
    if (this.isFlipped && this.waitingForCardClick) {
      // Use the anti-spoiler method
      this.clearCardAndProceedToNext();
      return;
    }

    this.isFlipped = !this.isFlipped;

    if (this.isFlipped) {
      flashcard.classList.add("flipped");
      // Track card interaction when flipped to see translation
      const currentCard =
        this.vocabApp.currentCards[this.vocabApp.currentIndex];
      if (currentCard) {
        this.vocabApp.trackCardInteraction(currentCard.id);
      }
    } else {
      flashcard.classList.remove("flipped");
    }
  }

  // Mark card as known/unknown and handle next card behavior
  markCard(isKnown) {
    if (this.vocabApp.currentCards.length === 0) return;

    const currentCard = this.vocabApp.currentCards[this.vocabApp.currentIndex];
    if (!currentCard) return;

    // Update known status
    if (isKnown) {
      this.vocabApp.knownCardsSet.add(currentCard.id);
    } else {
      this.vocabApp.knownCardsSet.delete(currentCard.id);
    }

    // Track the interaction
    this.vocabApp.trackCardInteraction(currentCard.id);
    this.vocabApp.saveProgress();

    // Simplified anti-spoiler approach: if card is showing back side,
    // clear content first, then flip, then show new card
    if (this.isFlipped) {
      // Card is showing back side - implement anti-spoiler sequence
      this.clearCardAndProceedToNext();
    } else {
      // Card is showing front side
      if (isKnown) {
        // "I know this" from front - go to next card immediately
        this.proceedToNextCard();
      } else {
        // "I don't know this" from front - flip to show back side, wait for click
        this.flipCard();
        this.waitingForCardClick = true;
      }
    }
  }

  // Anti-spoiler method: clear content, flip to front, then show new card
  clearCardAndProceedToNext() {
    const flashcard = document.getElementById("flashcard");
    if (!flashcard) {
      this.proceedToNextCard();
      return;
    }

    // Step 1: Clear the text content immediately
    const frontFace = flashcard.querySelector(".card-front .spanish-word");
    const backFace = flashcard.querySelector(".card-back .translation");
    const backExample = flashcard.querySelector(".card-back .example");

    if (frontFace) frontFace.textContent = "";
    if (backFace) backFace.textContent = "";
    if (backExample) backExample.textContent = "";

    // Step 2: Flip card back to front
    this.isFlipped = false;
    this.waitingForCardClick = false;
    flashcard.classList.remove("flipped");

    // Step 3: After flip animation completes, show new card
    setTimeout(() => {
      this.proceedToNextCard();
    }, 600); // Wait for CSS flip animation to complete
  }

  // Helper method to handle advancing to the next card
  proceedToNextCard() {
    const currentCard = this.vocabApp.currentCards[this.vocabApp.currentIndex];

    // If we're in "unknown only" mode and card is now known, remove it from current cards
    if (
      !this.showingAllCards &&
      this.vocabApp.knownCardsSet.has(currentCard.id)
    ) {
      this.vocabApp.currentCards.splice(this.vocabApp.currentIndex, 1);

      // Aggressively reshuffle remaining cards to prevent patterns after card removal
      if (this.vocabApp.currentCards.length > 1) {
        this.aggressiveShuffleForFlashcards(this.vocabApp.currentCards);
      }

      // Check if this was the last unknown card in the filtered set
      if (this.vocabApp.currentCards.length === 0) {
        // Check if there are any unknown cards left in the filtered set
        const filteredCards = this.vocabApp.applyFilters();
        const unknownFilteredCards = filteredCards.filter(
          (card) => !this.vocabApp.knownCardsSet.has(card.id)
        );

        if (unknownFilteredCards.length === 0) {
          // All cards in this filter are now known - show completion message
          this.showCompletionMessage();
          this.vocabApp.updateStats();
          return;
        } else {
          // There are still unknown cards, but not in current session
          // Reload the unknown cards with aggressive shuffling
          this.vocabApp.currentCards = [...unknownFilteredCards];
          this.aggressiveShuffleForFlashcards(this.vocabApp.currentCards);
          this.vocabApp.currentIndex = 0;
        }
      } else {
        // Adjust index if needed
        if (this.vocabApp.currentIndex >= this.vocabApp.currentCards.length) {
          this.vocabApp.currentIndex = 0;
        }
      }
    } else {
      // Move to next card
      this.vocabApp.currentIndex =
        (this.vocabApp.currentIndex + 1) % this.vocabApp.currentCards.length;
    }

    // Update stats
    this.vocabApp.updateStats();

    // Show the new card
    this.showCurrentCard();
  }

  // Navigate to next card manually (without marking as known/unknown)
  nextCard() {
    if (this.vocabApp.currentCards.length === 0) return;

    this.vocabApp.currentIndex =
      (this.vocabApp.currentIndex + 1) % this.vocabApp.currentCards.length;

    this.showCurrentCard();
  }

  // Navigate to previous card manually (without marking as known/unknown)
  previousCard() {
    if (this.vocabApp.currentCards.length === 0) return;

    this.vocabApp.currentIndex =
      (this.vocabApp.currentIndex - 1 + this.vocabApp.currentCards.length) %
      this.vocabApp.currentCards.length;

    this.showCurrentCard();
  }

  showCompletionMessage() {

    const flashcard = document.getElementById("flashcard");
    if (!flashcard) return;

    // Use the same flashcard structure as regular cards
    flashcard.innerHTML = `
      <div class="card-face card-front">
        <div class="category-badge">${I18n.t("flash.complete.badge")}</div>
        <div class="spanish-word">${I18n.t("flash.complete.title")}</div>
      </div>
      <div class="card-face card-back">
        <div class="translation">${I18n.t("flash.complete.next")}</div>
        <div class="example">${I18n.t("flash.complete.hint")}</div>
      </div>
    `;

    // Make the card auto-flipped to show the suggestions
    flashcard.classList.add("flipped");

    // Add click handler to flip between congratulations and suggestions
    flashcard.onclick = () => {
      flashcard.classList.toggle("flipped");
    };

    // Hide the action buttons
    const cardActions = document.querySelector(".card-actions");
    if (cardActions) {
      cardActions.style.display = "none";
    }
  }

  refreshDisplay() {
    // Use aggressive shuffling instead of simple sorting to prevent alphabetical patterns
    this.aggressiveShuffleForFlashcards(this.vocabApp.currentCards);
    this.vocabApp.currentIndex = 0;

    // Ensure card is reset to front side before showing new content
    const flashcard = document.getElementById("flashcard");
    if (flashcard && flashcard.classList.contains("flipped")) {
      flashcard.classList.remove("flipped");
      this.isFlipped = false;
    }

    this.vocabApp.updateStats();
    this.showCurrentCard();
  }

  // Replace shuffleCards method with aggressive shuffling to prevent patterns
  shuffleCards() {
    // Use aggressive shuffling instead of simple sorting
    this.aggressiveShuffleForFlashcards(this.vocabApp.currentCards);
    this.vocabApp.currentIndex = 0;
    this.showCurrentCard();
  }

  showNoCardsMessage() {
    const flashcard = document.getElementById("flashcard");
    if (!flashcard) return;


    flashcard.innerHTML = `
      <div class="card-face card-front" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="no-cards-message">
          <h3>${I18n.t("flash.none.title")}</h3>
          <p>${I18n.t("flash.none.hint")}</p>
        </div>
      </div>
    `;

    // Remove flip functionality when showing no cards message
    flashcard.onclick = null;

    // Hide the action buttons
    const cardActions = document.querySelector(".card-actions");
    if (cardActions) {
      cardActions.style.display = "none";
    }
  }

  updateToggleButton() {
    const toggleSwitch = document.querySelector(".toggle-switch");
    const toggleLabel = document.querySelector(".toggle-label");

    if (toggleSwitch) {
      if (this.showingAllCards) {
        toggleSwitch.classList.add("all-cards");
      } else {
        toggleSwitch.classList.remove("all-cards");
      }
    }

    if (toggleLabel) {
      toggleLabel.textContent = this.showingAllCards
        ? "All Cards"
        : "Unknown Only";
    }
  }

  // Method to update translation based on language preference
  updateTranslation(card) {
    const translation = document.querySelector(".translation");
    if (translation && card) {
      translation.textContent = card.translation || I18n.t("card.noTranslation");
    }
  }
}

// Make FlashcardMode available globally
window.FlashcardMode = FlashcardMode;

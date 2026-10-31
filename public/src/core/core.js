// Core DGTVocabulary class with essential functionality

class DGTVocabulary {
  constructor() {
    this.allCards = [];
    this.currentCards = [];
    this.currentIndex = 0;
    this.knownCardsSet = new Set();
    this.cardInteractionHistory = {}; // Add this to track interaction timestamps
    this.currentMode = "quiz"; // Ensure quiz mode starts by default
    this.selectedCategory = "all";
    this.selectedTopic = "all"; // Add topic filtering support

    this.init();
  }

  // Initialization
  init() {
    this.loadFlashcards();

    // Only set up event listeners if we're on the main page
    if (!window.isVocabManagerPage) {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Event listeners are minimal here, most are handled in specific modules
  }

  // Data Loading
  loadFlashcards() {
    try {
      // Use embedded vocabulary data
      if (typeof window.vocabularyData !== "undefined") {
        // Cards of the selected collection; their ids are Firestore document ids.
        this.allCards = DGTVocabulary.toStudyCards(window.vocabularyData);
      } else {
        console.error(
          "Vocabulary data not found. The collection has not been loaded yet."
        );
        return;
      }

      // Initialize other modules first
      if (window.CategoryManager) {
        this.categoryManager = new window.CategoryManager(this);
      }
      if (window.StatsManager) {
        this.statsManager = new window.StatsManager(this);
      }
      if (window.FlashcardMode) {
        this.flashcardMode = new window.FlashcardMode(this);
      }
      if (window.QuizMode) {
        this.quizMode = new window.QuizMode(this);
      }

      // Load progress first
      this.loadProgress();

      // Start with unknown cards only (default mode) - after loading progress
      this.currentCards = this.allCards.filter(
        (card) => !this.knownCardsSet.has(card.id)
      );

      // Sort cards by last interaction time (oldest first)
      this.sortCardsByLastInteraction();

      // Initialize the toggle button state
      if (this.flashcardMode) {
        this.flashcardMode.updateToggleButton();
      }

      this.updateStats();

      // Set the initial mode UI to quiz and start quiz immediately
      if (window.UIHelpers) {
        window.UIHelpers.setMode("quiz");
      }

      // Don't automatically start quiz - let user click the mode button
      // if (this.quizMode) {
      //   this.quizMode.startQuiz();
      // }
    } catch (error) {
      console.error("Error loading flashcards:", error);
    }
  }

  static toStudyCards(cards) {
    return cards.map((card) => ({
      id: card.id,
      word: card.word || "",
      translation: card.translation || "", // optional
    }));
  }

  // Switches to another set of cards (a collection), keeping progress and the current mode.
  setCards(cards) {
    this.allCards = DGTVocabulary.toStudyCards(cards);
    this.updateCurrentCards();
    this.updateStats();
    if (this.currentMode === "flashcard" && this.flashcardMode) {
      this.flashcardMode.showCurrentCard();
    } else if (this.quizMode) {
      this.quizMode.startQuiz();
    }
  }

  loadProgress() {
    // Progress is per account: loaded from the cloud before the app starts.
    const progress = window.initialProgress || { known: [], history: {} };
    this.knownCardsSet = new Set(progress.known);
    this.cardInteractionHistory = { ...progress.history };

    this.updateStats();
  }

  saveProgress() {
    // Interactions come in quick bursts, so write at most once every couple of seconds.
    this.progressDirty = true;
    clearTimeout(this.saveProgressTimer);
    this.saveProgressTimer = setTimeout(() => this.flushProgress(), 2000);
  }

  flushProgress() {
    clearTimeout(this.saveProgressTimer);
    if (!this.progressDirty || !window.Cloud || !window.Cloud.user) return;
    this.progressDirty = false;

    // Only keep entries for cards that still exist, so deleted cards don't linger in progress.
    // That means every card of the user, not just the collection being studied.
    const ids = window.allCardIds || new Set(this.allCards.map((card) => card.id));
    const history = {};
    Object.entries(this.cardInteractionHistory).forEach(([id, time]) => {
      if (ids.has(id)) history[id] = time;
    });

    window.Cloud.saveProgress({
      known: [...this.knownCardsSet].filter((id) => ids.has(id)),
      history,
    }).catch((error) => console.error("Error saving progress:", error));
  }

  // Track interaction with a card
  trackCardInteraction(cardId) {
    this.cardInteractionHistory[cardId] = Date.now();
    this.saveProgress();
  }

  // Sort cards by last interaction time (oldest first) with some randomness
  sortCardsByLastInteraction() {
    // First sort by interaction time (oldest first)
    this.currentCards.sort((a, b) => {
      const timeA = this.cardInteractionHistory[a.id] || 0;
      const timeB = this.cardInteractionHistory[b.id] || 0;
      return timeA - timeB; // Oldest interactions first
    });

    // Then apply a weighted shuffle - cards that are older will tend to stay near
    // the front, but with some randomness to prevent rigid ordering
    this.weightedShuffle(this.currentCards);
  }

  // Weighted shuffle that keeps older cards (those sorted to the front)
  // mostly at the front, but introduces some controlled randomness
  weightedShuffle(array) {
    const length = array.length;
    if (length <= 1) return array;

    // Perform a partial shuffle that's biased toward keeping early elements early
    // and later elements later
    for (let i = 0; i < length; i++) {
      // Calculate a weighted random position that's more likely to be close to i
      // The further we are in the array, the more potential swap range
      const maxOffset = Math.floor(Math.sqrt(i + 1) * 2); // Square root creates a nice curve
      const offset = Math.floor(Math.random() * (maxOffset + 1));

      // Calculate swap position - more likely to be close to current position
      const j = Math.max(
        0,
        Math.min(
          length - 1,
          i - offset + Math.floor(Math.random() * (offset * 2 + 1))
        )
      );

      // Swap elements
      if (i !== j) {
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    return array;
  }

  // Reset the interaction tracking for all cards or specific cards
  resetCardInteractions(cardIds = null) {
    if (cardIds === null) {
      // Reset all interaction history
      this.cardInteractionHistory = {};
    } else {
      // Reset only specific cards
      cardIds.forEach((id) => {
        delete this.cardInteractionHistory[id];
      });
    }
    this.saveProgress();
  }

  // Utility Functions
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Get unique categories from all cards
  getUniqueCategories() {
    const categories = new Set();
    this.allCards.forEach((card) => {
      if (card.category) {
        categories.add(card.category.toLowerCase());
      }
    });

    // Only return categories that actually exist in the data
    // Don't add default categories if they don't have any words
    return Array.from(categories).sort();
  }

  // Get unique topics from all cards
  getUniqueTopics() {
    const topics = new Set();
    this.allCards.forEach((card) => {
      if (card.topics && card.topics.length > 0) {
        card.topics.forEach((topic) => topics.add(topic));
      }
    });
    return Array.from(topics).sort();
  }

  // Apply both category and topic filters
  applyFilters() {
    let filteredCards = this.allCards;

    console.log(`Starting with ${filteredCards.length} cards`);
    console.log(
      `Selected topic: ${this.selectedTopic}, Selected category: ${this.selectedCategory}`
    );

    // Apply topic filter FIRST
    if (this.selectedTopic !== "all") {
      const beforeFilter = filteredCards.length;
      filteredCards = filteredCards.filter(
        (card) => card.topics && card.topics.includes(this.selectedTopic)
      );
      console.log(
        `After topic filter (${this.selectedTopic}): ${filteredCards.length} cards (was ${beforeFilter})`
      );

      // Debug: Show which cards have the selected topic
      if (filteredCards.length > 0) {
        console.log(
          `Cards with topic ${this.selectedTopic}:`,
          filteredCards.map(
            (card) =>
              `${card.word} (topics: ${card.topics?.join(", ") || "none"})`
          )
        );
      } else {
        console.log(`No cards found with topic ${this.selectedTopic}`);
        // Show first few cards and their topics for debugging
        console.log(
          "Sample cards and their topics:",
          this.allCards
            .slice(0, 10)
            .map((card) => `${card.word}: ${card.topics?.join(", ") || "none"}`)
        );
      }
    }

    // Then apply category filter
    if (this.selectedCategory !== "all") {
      const beforeFilter = filteredCards.length;
      filteredCards = filteredCards.filter(
        (card) => card.category.toLowerCase() === this.selectedCategory
      );
      console.log(
        `After category filter (${this.selectedCategory}): ${filteredCards.length} cards (was ${beforeFilter})`
      );
    }

    return filteredCards;
  }

  // Add a new method to update current cards based on filters
  updateCurrentCards() {
    // Get all cards that match the current filters
    const filteredCards = this.applyFilters();

    console.log(`Filtered cards: ${filteredCards.length}`);

    // Apply the toggle state (all cards vs unknown only)
    if (this.flashcardMode && this.flashcardMode.showingAllCards) {
      this.currentCards = filteredCards;
    } else {
      this.currentCards = filteredCards.filter(
        (card) => !this.knownCardsSet.has(card.id)
      );
    }

    console.log(
      `Current cards after known filter: ${this.currentCards.length}`
    );

    // Apply aggressive shuffling to prevent alphabetical patterns
    if (
      this.flashcardMode &&
      this.flashcardMode.aggressiveShuffleForFlashcards
    ) {
      this.flashcardMode.aggressiveShuffleForFlashcards(this.currentCards);
    } else {
      // Fallback to old method if flashcard mode isn't available yet
      this.sortCardsByLastInteraction();
    }

    // Reset index to 0
    this.currentIndex = 0;
  }

  // Update filterCards method to use the new updateCurrentCards
  filterCards() {
    this.updateCurrentCards();
    this.updateStats();
    this.showCurrentCard();

    // Update filter info display
    if (this.categoryManager && this.categoryManager.updateFilterInfo) {
      this.categoryManager.updateFilterInfo();
    }
  }

  // Filter cards by topic
  filterByTopic(topicId) {
    this.selectedTopic = topicId;

    // Refresh category manager to show only available categories for this topic
    if (this.categoryManager) {
      this.categoryManager.populateCategoryFilter(topicId);
      // Reset category to "all" when changing topics to avoid empty results
      this.selectedCategory = "all";
      const categorySelector = document.getElementById("categorySelector");
      if (categorySelector) {
        categorySelector.value = "all";
      }
    }

    // Apply the filters and update current cards
    this.updateCurrentCards();
    this.updateStats();

    // Restart current mode with filtered cards
    if (this.currentMode === "quiz" && this.quizMode) {
      this.quizMode.startQuiz();
    } else if (this.currentMode === "flashcard" && this.flashcardMode) {
      this.flashcardMode.showCurrentCard();
    }
  }

  // Delegate methods to modules
  updateStats() {
    if (this.statsManager) {
      this.statsManager.updateStats();
    }
  }

  showCurrentCard() {
    // Only call this for flashcard mode, quiz mode handles its own display
    if (this.currentMode === "flashcard" && this.flashcardMode) {
      this.flashcardMode.showCurrentCard();
    }
  }

  setMode(mode) {
    this.currentMode = mode;

    // Update UI first
    if (window.UIHelpers) {
      window.UIHelpers.setMode(mode);
    }

    // When switching modes, ensure we have properly filtered cards
    this.updateCurrentCards();

    if (mode === "flashcard") {
      // Show current card for flashcard mode
      if (this.flashcardMode) {
        this.flashcardMode.showCurrentCard();
      }
    } else if (mode === "quiz") {
      // Start quiz with filtered cards
      if (this.quizMode) {
        this.quizMode.startQuiz();
      }
    }
  }
}

// Make DGTVocabulary available globally
window.DGTVocabulary = DGTVocabulary;

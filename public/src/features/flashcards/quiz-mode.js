// Quiz mode functionality

class QuizMode {
  constructor(vocabApp) {
    this.vocabApp = vocabApp;
    this.quizScore = 0;
    this.quizTotal = 0;
    // Ensure sets exist
    this.vocabApp.knownCardsSet = this.vocabApp.knownCardsSet || new Set();
    this.vocabApp.unknownCardsSet = this.vocabApp.unknownCardsSet || new Set();
  }

  // Use shared aggressive shuffle utility
  aggressiveShuffleForQuiz(array) {
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

  startQuiz() {
    console.log("Starting quiz mode...");

    // Ensure we have properly filtered current cards
    this.vocabApp.updateCurrentCards();

    // Get unknown cards from the filtered set; only translated words can be quizzed
    const unknownCards = this.vocabApp.currentCards.filter(
      (card) => !this.vocabApp.knownCardsSet.has(card.id) && card.translation
    );

    // Check if we have enough unknown cards to start the quiz
    if (unknownCards.length < 2) {

      // Show error in quiz interface with flashcard design
      const quizQuestion = document.getElementById("quizQuestion");
      const quizOptions = document.getElementById("quizOptions");
      if (quizQuestion) {
        quizQuestion.textContent = "";
      }
      if (quizOptions) {
        quizOptions.innerHTML = `
          <div class="flashcard-container" style="max-width: 500px; margin: 0 auto;">
            <div class="flashcard">
              <div class="card-face card-front" style="background: var(--color-warning); color: white;">
                <div class="spanish-word">A quiz needs at least 2 unknown words with a translation.</div>
              </div>
              <div class="card-face card-back">
                <div class="translation">You have ${unknownCards.length} right now.</div>
                <div class="example">Add words or translations in My Words, or reset your progress to review known words.</div>
              </div>
            </div>
          </div>
        `;

        // Make the error card flippable
        const errorCard = quizOptions.querySelector(".flashcard");
        if (errorCard) {
          errorCard.onclick = () => {
            errorCard.classList.toggle("flipped");
          };

          // Auto-flip after 2 seconds to show the suggestion
          setTimeout(() => {
            errorCard.classList.add("flipped");
          }, 2000);
        }
      }
      return;
    }

    // Use the filtered unknown cards
    this.vocabApp.currentCards = [...unknownCards];

    // For quiz mode, we want more aggressive randomization
    // Apply multiple shuffles to ensure truly random order
    this.aggressiveShuffleForQuiz(this.vocabApp.currentCards);

    this.quizScore = 0;
    this.quizTotal = 0;
    this.nextQuizQuestion();
  }

  nextQuizQuestion() {
    // Get unknown cards only for quiz questions from current filtered set
    const unknownCards = this.vocabApp.currentCards.filter(
      (card) => !this.vocabApp.knownCardsSet.has(card.id)
    );

    // If no unknown cards remain, show completion message
    if (unknownCards.length === 0) {
      this.showQuizCompletionCard();
      return;
    }

    // If only one unknown card remains, show transition message and switch to flashcard mode
    if (unknownCards.length === 1) {
      this.showLastCardTransition(unknownCards[0]);
      return;
    }

    // Select correct card with aggressive randomization
    // Instead of just using the first 50%, use a more dynamic approach
    let correctCard;

    if (unknownCards.length <= 5) {
      // For small sets, completely random selection
      correctCard =
        unknownCards[Math.floor(Math.random() * unknownCards.length)];
    } else {
      // For larger sets, weighted random selection with high randomness
      const priorityPoolSize = Math.floor(unknownCards.length * 0.8); // Use 80% instead of 50%
      const priorityPool = unknownCards.slice(0, priorityPoolSize);

      // Extra shuffle of the priority pool itself
      if (window.ShuffleUtils) {
        window.ShuffleUtils.multiShuffle(priorityPool, 2);
      } else {
        this.vocabApp.shuffleArray(priorityPool);
        this.vocabApp.shuffleArray(priorityPool); // Double shuffle for extra randomness
      }

      correctCard =
        priorityPool[Math.floor(Math.random() * priorityPool.length)];
    }

    // Track this interaction
    this.vocabApp.trackCardInteraction(correctCard.id);

    const options = [correctCard];

    // Determine how many options to show based on available cards in current category
    // Maximum of 4 options, but can be fewer if not enough cards are available
    const maxOptions = Math.min(4, this.vocabApp.currentCards.length);

    // Get available wrong options excluding the correct card
    const availableWrongOptions = this.vocabApp.currentCards.filter(
      (card) => card.id !== correctCard.id
    );

    // Aggressive shuffling for wrong options to prevent patterns
    if (window.ShuffleUtils) {
      window.ShuffleUtils.multiShuffle(availableWrongOptions, 3);
    } else {
      this.vocabApp.shuffleArray(availableWrongOptions);
      this.vocabApp.shuffleArray(availableWrongOptions); // Double shuffle
      this.vocabApp.shuffleArray(availableWrongOptions); // Triple shuffle for maximum randomness
    }

    // Add wrong options from current category cards only
    const translationField = "translation";
    let attempts = 0;
    const maxAttempts = availableWrongOptions.length * 2; // Prevent infinite loops

    for (
      let i = 0;
      i < availableWrongOptions.length &&
      options.length < maxOptions &&
      attempts < maxAttempts;
      i++
    ) {
      attempts++;
      const candidateCard = availableWrongOptions[i];

      // Check if this card has a unique translation compared to already selected options
      const hasUniqueTranslation = !options.find(
        (card) => card[translationField] === candidateCard[translationField]
      );

      if (hasUniqueTranslation) {
        options.push(candidateCard);
      }
    }

    // If we still don't have enough unique options and there are more cards available,
    // try to find any cards with different IDs (even if translations might be similar)
    if (
      options.length < maxOptions &&
      availableWrongOptions.length >= maxOptions - 1
    ) {
      for (
        let i = 0;
        i < availableWrongOptions.length && options.length < maxOptions;
        i++
      ) {
        const candidateCard = availableWrongOptions[i];

        // Just check for unique ID (avoid duplicate cards)
        const hasUniqueId = !options.find(
          (card) => card.id === candidateCard.id
        );

        if (hasUniqueId) {
          options.push(candidateCard);
        }
      }
    }

    // Final aggressive shuffle of all options to ensure random order
    if (window.ShuffleUtils) {
      window.ShuffleUtils.multiShuffle(options, 2);
    } else {
      this.vocabApp.shuffleArray(options);
      this.vocabApp.shuffleArray(options); // Double shuffle for final randomization
    }

    // Final validation: ensure we have at least 2 options for a valid quiz
    if (options.length < 2) {
      const quizQuestion = document.getElementById("quizQuestion");
      const optionsContainer = document.getElementById("quizOptions");

      if (quizQuestion) {
        quizQuestion.textContent = "";
      }

      if (optionsContainer) {
        optionsContainer.innerHTML = `
          <div class="flashcard-container" style="max-width: 500px; margin: 0 auto;">
            <div class="flashcard">
              <div class="card-face card-front" style="background: var(--color-warning); color: white;">
                <div class="category-badge" style="background: rgba(255,255,255,0.2); color: white;">⚠️ Insufficient unique cards for quiz</div>
                <div class="spanish-word">Not enough unique cards available</div>
              </div>
              <div class="card-face card-back">
                <div class="translation">Switch to flashcard mode or add more vocabulary.</div>
                <div class="example">Add more words with different translations in My Words.</div>
              </div>
            </div>
          </div>
        `;

        // Make the error card flippable
        const errorCard = optionsContainer.querySelector(".flashcard");
        if (errorCard) {
          errorCard.onclick = () => {
            errorCard.classList.toggle("flipped");
          };

          setTimeout(() => {
            errorCard.classList.add("flipped");
          }, 2000);
        }
      }
      return;
    }

    // Set the quiz question text - this was missing!
    const quizQuestion = document.getElementById("quizQuestion");
    if (quizQuestion) {
      // Clear existing content
      quizQuestion.innerHTML = "";

      // Create question text with Spanish word properly styled
      const questionText = document.createTextNode('What does "');
      quizQuestion.appendChild(questionText);

      // Create span for the Spanish word with appropriate class
      const spanishWordSpan = document.createElement("span");
      spanishWordSpan.className = "spanish-word spanish-highlight";
      // Also set inline styles as fallback to ensure visibility
      spanishWordSpan.style.color = "#dc8f64"; // Direct color as fallback
      spanishWordSpan.style.fontWeight = "600";
      spanishWordSpan.style.fontFamily = '"DM Serif Display", serif';
      spanishWordSpan.textContent = correctCard.word;
      quizQuestion.appendChild(spanishWordSpan);

      // Add the rest of the question
      const endText = document.createTextNode('" mean?');
      quizQuestion.appendChild(endText);

      // Debug log to help troubleshoot
      console.log("Quiz question set:", {
        word: correctCard.word,
        className: spanishWordSpan.className,
        computedStyle: window.getComputedStyle(spanishWordSpan).color,
      });
    }

    // Get options container
    const optionsContainer = document.getElementById("quizOptions");
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = "";

    // Create and append each option as a flippable card
    options.forEach((option, index) => {
      const cardContainer = document.createElement("div");
      cardContainer.className = "quiz-card-container";

      const card = document.createElement("div");
      card.className = "quiz-card";
      card.id = `quiz-card-${index}`;

      card.dataset.optionId = option.id;
      card.dataset.correctId = correctCard.id;

      const frontFace = document.createElement("div");
      frontFace.className = "quiz-card-face quiz-card-front";

      // Use translation based on current language preference
      const translationText = option.translation;

      // Ensure we have valid text to display (fallback protection)
      const displayText =
        translationText && translationText.trim()
          ? translationText.trim()
          : option.word || "Unknown";

      frontFace.innerHTML = `<div class="quiz-option-text">${displayText}</div>`;

      const backFace = document.createElement("div");
      backFace.className = "quiz-card-face quiz-card-back";

      card.onclick = (e) => {
        if (card.classList.contains("flipped")) {
          e.stopPropagation();
          return;
        }
        this.selectQuizOption(card);
      };

      card.appendChild(frontFace);
      card.appendChild(backFace);
      cardContainer.appendChild(card);
      optionsContainer.appendChild(cardContainer);
    });

    const nextBtn = document.getElementById("nextQuizBtn");
    if (nextBtn) {
      nextBtn.style.display = "none";
    }
  }

  selectQuizOption(element) {
    const selectedId = element.dataset.optionId;
    const correctId = element.dataset.correctId;

    // Track interaction with both selected and correct cards
    this.vocabApp.trackCardInteraction(selectedId);
    this.vocabApp.trackCardInteraction(correctId);

    const isCorrect = selectedId === correctId;

    // Track quiz answer with counts
    if (window.Analytics) {
      const knownCount = this.vocabApp.knownCardsSet.size;
      const remainingCards = this.vocabApp.currentCards.length;
      window.Analytics.trackQuizInteraction(
        isCorrect ? "Correct Answer" : "Wrong Answer",
        knownCount
      );
    }

    const selectedCard = this.vocabApp.allCards.find(
      (card) => card.id === selectedId
    );
    const correctCard = this.vocabApp.allCards.find(
      (card) => card.id === correctId
    );
    if (!selectedCard || !correctCard) return;

    // Ensure sets exist before using them
    if (!this.vocabApp.knownCardsSet) this.vocabApp.knownCardsSet = new Set();
    if (!this.vocabApp.unknownCardsSet)
      this.vocabApp.unknownCardsSet = new Set();

    const backFace = element.querySelector(".quiz-card-back");
    if (backFace) {
      if (isCorrect) {
        backFace.classList.add("correct");
        // Use translation based on current language preference
        const translationText = selectedCard.translation;

        backFace.innerHTML = `
          <div class="quiz-card-translation">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span>${translationText}</span>
          </div>
          <div class="quiz-card-word mobile-hidden">${selectedCard.word}</div>
        `;

        // Even if correct answer is selected, if there were wrong attempts
        // add the correct word to unknown list
        const anyWrongAttempts = document.querySelector(
          ".quiz-card.flipped.wrong"
        );
        if (anyWrongAttempts) {
          this.vocabApp.unknownCardsSet.add(correctId);
          // Don't remove the card from currentCards if there were wrong attempts
          // Keep it in the quiz pool for continued practice
        } else {
          this.vocabApp.knownCardsSet.add(correctId);
          // Remove from unknown set if it was there
          this.vocabApp.unknownCardsSet.delete(correctId);
          // Only remove from current cards if there were no wrong attempts
          this.vocabApp.currentCards = this.vocabApp.currentCards.filter(
            (card) => card.id !== correctId
          );
        }
        this.vocabApp.saveProgress();

        // Reshuffle remaining cards after each correct answer to ensure randomness
        this.aggressiveShuffleForQuiz(this.vocabApp.currentCards);

        this.vocabApp.updateStats();

        // Check if there are still cards that need practice
        // Cards need practice if they are either:
        // 1. Not in the known set (unknown cards)
        // 2. In the unknown set (cards with wrong attempts that need more practice)
        const cardsNeedingPractice = this.vocabApp.currentCards.filter(
          (card) => !this.vocabApp.knownCardsSet.has(card.id)
        );

        document.querySelectorAll(".quiz-card").forEach((card) => {
          // Only disable and flip the correct card
          if (card === element) {
            card.classList.add("flipped");
            card.style.pointerEvents = "none";
          }
        });

        // Keep the original question displayed even after a correct answer
        // const quizQuestion = document.getElementById("quizQuestion");
        // quizQuestion.textContent = `Correct!`;

        setTimeout(() => {
          // If only one card needs practice, switch to flashcard mode
          if (cardsNeedingPractice.length <= 1) {
            if (cardsNeedingPractice.length === 1) {
              // Show transition and switch to flashcard mode
              this.showLastCardTransition(cardsNeedingPractice[0]);
            } else {
              // All cards are completed
              this.showQuizCompletionCard();
            }
          } else {
            // Continue with next quiz question
            this.nextQuizQuestion();
          }
        }, 750);
      } else {
        backFace.classList.add("wrong");
        element.classList.add("wrong");
        // Use translation based on current language preference
        const translationText = selectedCard.translation;

        backFace.innerHTML = `
          <div class="quiz-card-translation">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            <span>${translationText}</span>
          </div>
          <div class="quiz-card-word">${selectedCard.word}</div>
        `;

        this.vocabApp.unknownCardsSet.add(correctId);
        this.vocabApp.unknownCardsSet.add(selectedId);
        this.vocabApp.saveProgress();

        element.classList.add("flipped");
        element.style.pointerEvents = "none";
      }
    }

    element.classList.add("flipped");
  }

  showQuizCompletionCard() {

    // Clear question text
    const quizQuestion = document.getElementById("quizQuestion");
    if (quizQuestion) {
      quizQuestion.textContent = "";
    }

    // Create a beautiful flashcard-style completion message
    const quizOptions = document.getElementById("quizOptions");
    if (quizOptions) {
      quizOptions.innerHTML = `
        <div class="flashcard-container" style="max-width: 500px; margin: 0 auto;">
          <div class="flashcard completion-card">
            <div class="card-face card-front" style="background: var(--color-success); color: white;">
              <div class="category-badge" style="background: rgba(255,255,255,0.2); color: white;">🎉 Quiz Complete!</div>
              <div class="spanish-word">¡Felicidades!</div>
            </div>
            <div class="card-face card-back">
              <div class="translation">You know all your words!</div>
              <div class="example">Add new words in My Words, or reset your progress to review them again.</div>
            </div>
          </div>
        </div>
      `;

      // Make the completion card flippable
      const completionCard = quizOptions.querySelector(".flashcard");
      if (completionCard) {
        completionCard.onclick = () => {
          completionCard.classList.toggle("flipped");
        };

        // Auto-flip after 2 seconds to show the message
        setTimeout(() => {
          completionCard.classList.add("flipped");
        }, 2000);
      }
    }
  }

  showLastCardTransition(lastCard) {
    // Clear question text
    const quizQuestion = document.getElementById("quizQuestion");
    if (quizQuestion) {
      quizQuestion.textContent = "";
    }

    // Create a beautiful flashcard-style transition message
    const quizOptions = document.getElementById("quizOptions");
    if (quizOptions) {
      quizOptions.innerHTML = `
        <div class="flashcard-container" style="max-width: 500px; margin: 0 auto;">
          <div class="flashcard transition-card">
            <div class="card-face card-front" style="background: var(--color-accent); color: white;">
              <div class="category-badge" style="background: rgba(255,255,255,0.2); color: white;">🎉 Almost done!</div>
              <div class="spanish-word">One card remaining</div>
            </div>
            <div class="card-face card-back">
              <div class="translation">Switching to flashcard mode...</div>
              <div class="example">Perfect for reviewing the last word: "${lastCard.word}"</div>
            </div>
          </div>
        </div>
      `;

      // Make the transition card flippable
      const transitionCard = quizOptions.querySelector(".flashcard");
      if (transitionCard) {
        transitionCard.onclick = () => {
          transitionCard.classList.toggle("flipped");
        };

        // Auto-flip after 1 second
        setTimeout(() => {
          transitionCard.classList.add("flipped");
        }, 1000);
      }
    }

    // Switch to flashcard mode after showing the message
    setTimeout(() => {
      // Set the current cards to just the last unknown card
      this.vocabApp.currentCards = [lastCard];
      this.vocabApp.currentIndex = 0;

      // Switch to flashcard mode
      if (window.setMode) {
        window.setMode("flashcard");
      }

      // Update the mode buttons
      document
        .querySelectorAll(".mode-btn")
        .forEach((btn) => btn.classList.remove("active"));
      const flashcardBtn = document.querySelector(
        ".mode-btn[onclick*='flashcard']"
      );
      if (flashcardBtn) {
        flashcardBtn.classList.add("active");
      }

      // Show the actual flashcard
      if (this.vocabApp.flashcardMode) {
        this.vocabApp.flashcardMode.showCurrentCard();
      }
    }, 3000);
  }
}

// Make QuizMode available globally
window.QuizMode = QuizMode;

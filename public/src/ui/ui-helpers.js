// UI utility functions and global functions for HTML onclick

class UIHelpers {
  static showMessage(text, type, duration = 5000) {
    const messageContainer = document.getElementById("messageContainer");
    if (messageContainer) {
      // Create unique ID for this message
      const messageId = `msg-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create message element
      const messageElement = document.createElement("div");
      messageElement.className = `${type}-message`;
      messageElement.id = messageId;
      messageElement.innerHTML = `
        ${text}
        <button class="message-close" onclick="document.getElementById('${messageId}').remove()">&times;</button>
      `;

      // Add to container
      messageContainer.appendChild(messageElement);

      // Auto-hide message after specified duration
      if (duration > 0) {
        setTimeout(() => {
          const msgElement = document.getElementById(messageId);
          if (msgElement) {
            msgElement.remove();
          }
        }, duration);
      }
    }
  }

  static clearMessages() {
    const messageContainer = document.getElementById("messageContainer");
    if (messageContainer) {
      messageContainer.innerHTML = "";
    }
  }

  static setMode(mode) {
    // Update button states
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Find and activate the correct button
    const buttons = document.querySelectorAll(".mode-btn");
    buttons.forEach((btn) => {
      const onclick = btn.getAttribute("onclick");
      if (onclick && onclick.includes(`'${mode}'`)) {
        btn.classList.add("active");
      }
    });

    // Show/hide appropriate sections
    const flashcardMode = document.getElementById("flashcardMode");
    const quizMode = document.getElementById("quizMode");

    if (mode === "flashcard") {
      if (flashcardMode) flashcardMode.classList.remove("hidden");
      if (quizMode) quizMode.classList.add("hidden");
    } else if (mode === "quiz") {
      if (flashcardMode) flashcardMode.classList.add("hidden");
      if (quizMode) quizMode.classList.remove("hidden");
    }
  }
}

// Global functions for HTML onclick attributes
function flipCard() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.flipCard();
  }
}

function resetProgress() {
  // Use the new ResetProgress utility instead of the old vocabApp method
  if (window.ResetProgress) {
    window.ResetProgress.resetAllProgress();
  } else {
    console.error("ResetProgress utility not available");
    alert("Reset functionality is not available. Please reload the page.");
  }
}

function markCard(known) {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.markCard(known);
  }
}

function setMode(mode, event) {
  UIHelpers.setMode(mode);

  // Track mode switch
  if (window.Analytics) {
    window.Analytics.trackModeSwitch(mode);
  }

  if (event && event.target) {
    const modeButtons = document.querySelectorAll(".mode-btn");
    if (modeButtons && modeButtons.length) {
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      event.target.classList.add("active");
    }
  }
}

function nextQuizQuestion() {
  if (window.vocabApp && window.vocabApp.quizMode) {
    window.vocabApp.quizMode.nextQuizQuestion();
  }
}

function toggleShowAllCards() {
  if (window.vocabApp && window.vocabApp.flashcardMode) {
    window.vocabApp.flashcardMode.toggleShowAllCards();
  }
}

// Make UIHelpers available globally
window.UIHelpers = UIHelpers;

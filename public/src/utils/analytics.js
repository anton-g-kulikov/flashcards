// Analytics helper functions

// Session tracking state
const sessionState = {
  startTime: Date.now(),
  modeStartTime: Date.now(),
  currentMode: "flashcard",
  cardsReviewed: 0,
  lastReviewTime: Date.now(),
};

// Helper function to safely send events to Google Analytics
function sendGoogleAnalyticsEvent(
  eventCategory,
  eventAction,
  eventLabel = null,
  eventValue = null
) {
  if (!window.gtag) return;

  const eventParams = {
    event_category: eventCategory,
    event_label: eventLabel,
  };
  if (eventValue !== null) {
    eventParams.value = eventValue;
  }
  gtag("event", eventAction, eventParams);
}

// Session events
function trackSessionStart() {
  const totalCards = window.vocabApp?.allCards?.length || 0;
  const knownCards = window.vocabApp?.knownCardsSet?.size || 0;

  // Reset session state
  sessionState.startTime = Date.now();
  sessionState.modeStartTime = Date.now();
  sessionState.cardsReviewed = 0;
  sessionState.lastReviewTime = Date.now();

  sendGoogleAnalyticsEvent("Session", "Start", "Initial Load", totalCards);
  sendGoogleAnalyticsEvent("User Stats", "Known Cards", null, knownCards);
}

function trackModeSwitch(mode) {
  // Track time spent in previous mode
  const timeInPreviousMode = Math.round(
    (Date.now() - sessionState.modeStartTime) / 1000
  );
  sendGoogleAnalyticsEvent(
    "Usage Time",
    sessionState.currentMode,
    "Time in seconds",
    timeInPreviousMode
  );

  // Update session state
  sessionState.currentMode = mode;
  sessionState.modeStartTime = Date.now();

  sendGoogleAnalyticsEvent("Navigation", "Mode Switch", mode);
}

// Card interaction events
function trackCardInteraction(action, category = "all", knownCount = null) {
  // Track individual card review
  sessionState.cardsReviewed++;

  // If it's been more than 5 minutes since last review, send a count update
  const timeSinceLastReview = Date.now() - sessionState.lastReviewTime;
  if (timeSinceLastReview > 5 * 60 * 1000) {
    // 5 minutes
    sendGoogleAnalyticsEvent(
      "Session Progress",
      "Cards Reviewed",
      category,
      sessionState.cardsReviewed
    );
    sessionState.lastReviewTime = Date.now();
  }

  sendGoogleAnalyticsEvent("Cards", action, category, knownCount);
}

// Language switching events
function trackLanguageSwitch(newLanguage) {
  sendGoogleAnalyticsEvent("Language", "Switch Language", newLanguage);
}

// Category selection events
function trackCategorySelect(category) {
  sendGoogleAnalyticsEvent("Categories", "Select Category", category);
}

// Quiz events
function trackQuizInteraction(action, score = null) {
  const params = {
    event_category: "Quiz",
    event_label: action,
  };
  if (score !== null) {
    params.value = score;
  }
  sendGoogleAnalyticsEvent("Quiz", action, action, score);
}

// Make functions available globally
window.Analytics = {
  trackSessionStart,
  trackModeSwitch,
  trackCardInteraction,
  trackLanguageSwitch,
  trackCategorySelect,
  trackQuizInteraction,
};

// Add window unload handler to track final session stats
window.addEventListener("beforeunload", () => {
  // Track final time in current mode
  const timeInCurrentMode = Math.round(
    (Date.now() - sessionState.modeStartTime) / 1000
  );
  sendGoogleAnalyticsEvent(
    "Usage Time",
    sessionState.currentMode,
    "Time in seconds",
    timeInCurrentMode
  );

  // Track total session time
  const totalSessionTime = Math.round(
    (Date.now() - sessionState.startTime) / 1000
  );
  sendGoogleAnalyticsEvent(
    "Usage Time",
    "Total Session",
    "Time in seconds",
    totalSessionTime
  );

  // Track total cards reviewed
  sendGoogleAnalyticsEvent(
    "Session Progress",
    "Total Cards Reviewed",
    null,
    sessionState.cardsReviewed
  );
});

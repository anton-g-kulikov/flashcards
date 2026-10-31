// Shared shuffling utilities for both flashcard and quiz modes

class ShuffleUtils {
  /**
   * Aggressive shuffle to prevent alphabetical patterns
   * This is a comprehensive shuffling algorithm that combines multiple techniques
   * to ensure truly random card distribution
   */
  static aggressiveShuffle(array, vocabApp) {
    if (!array || array.length <= 1) return array;

    // Step 1: Complete Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    // Step 2: Additional randomization with multiple passes
    // This ensures no subtle patterns remain from the original order
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < array.length; i++) {
        const j = Math.floor(Math.random() * array.length);
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    // Step 3: Apply educational weighting based on interaction history
    // but with aggressive mixing to prevent patterns
    if (vocabApp) {
      this.applyEducationalWeighting(array, vocabApp);
    }

    return array;
  }

  /**
   * Apply educational weighting but with aggressive randomization
   * This gives priority to cards that haven't been seen recently while
   * maintaining high randomness to prevent predictable patterns
   */
  static applyEducationalWeighting(array, vocabApp) {
    if (!array || array.length <= 1) return array;

    // Create weights based on interaction history (less recent = higher weight)
    const weights = array.map((card) => {
      const lastInteraction = vocabApp.cardInteractionHistory[card.id] || 0;
      const timeSinceInteraction = Date.now() - lastInteraction;
      // Cards that haven't been seen get maximum weight
      // Cards seen recently get lower weight but still substantial randomness
      return lastInteraction === 0
        ? 100
        : Math.max(
            10,
            Math.min(100, Math.floor(timeSinceInteraction / (1000 * 60 * 60)))
          ); // Hours since interaction
    });

    // Multiple weighted shuffles with high randomness
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < array.length; i++) {
        // High chance of swapping with any position, weighted by priority
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let randomWeight = Math.random() * totalWeight;

        let targetIndex = 0;
        for (let k = 0; k < weights.length; k++) {
          randomWeight -= weights[k];
          if (randomWeight <= 0) {
            targetIndex = k;
            break;
          }
        }

        // Add extra randomness - 30% chance to ignore weighting completely
        if (Math.random() < 0.3) {
          targetIndex = Math.floor(Math.random() * array.length);
        }

        [array[i], array[targetIndex]] = [array[targetIndex], array[i]];
        [weights[i], weights[targetIndex]] = [weights[targetIndex], weights[i]];
      }
    }

    return array;
  }

  /**
   * Simple Fisher-Yates shuffle for basic randomization
   * Use this when you don't need educational weighting
   */
  static basicShuffle(array) {
    if (!array || array.length <= 1) return array;

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  /**
   * Multiple shuffle passes for extra randomization
   * Use this when you want to be absolutely sure there are no patterns
   */
  static multiShuffle(array, passes = 3) {
    if (!array || array.length <= 1) return array;

    for (let pass = 0; pass < passes; pass++) {
      this.basicShuffle(array);
    }

    return array;
  }
}

// Make ShuffleUtils available globally
window.ShuffleUtils = ShuffleUtils;

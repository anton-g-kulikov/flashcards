/**
 * Simple SVG icon system for the Flashcards app
 * Single-stroke icons in Anthropic style
 */

// Create and inject the SVG symbols into the document
document.addEventListener("DOMContentLoaded", () => {
  // Wait a moment for other scripts to finish
  setTimeout(() => {
    replaceButtonsWithIcons();
  }, 100);
});

// Function to replace button text with icons
function replaceButtonsWithIcons() {
  // Know button - use a simple checkmark
  document.querySelectorAll(".know-btn").forEach((btn) => {
    if (!btn.querySelector(".icon")) {
      const text = btn.textContent.trim();
      btn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span>${text}</span>
      `;
    }
  });

  // Don't know button - use a question mark
  document.querySelectorAll(".dont-know-btn").forEach((btn) => {
    if (!btn.querySelector(".icon")) {
      const text = btn.textContent.trim();
      btn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 2.5-2.5 3-2.5 5"/>
          <circle cx="12" cy="17" r="0.1"/>
        </svg>
        <span>${text}</span>
      `;
    }
  });

  // Back link - use a left arrow
  document.querySelectorAll(".back-to-main-link").forEach((link) => {
    if (!link.querySelector(".icon")) {
      const text = link.textContent.trim().replace("←", "").trim();
      link.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12,19 5,12 12,5"/>
        </svg>
        <span>${text}</span>
      `;
    }
  });

  // Reset button - use a refresh icon
  document
    .querySelectorAll('button[onclick="resetProgress(this)"]')
    .forEach((btn) => {
      if (!btn.querySelector(".icon")) {
        const text = btn.textContent.trim();
        btn.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span>${text}</span>
        `;
      }
    });
}

// Export for use in other scripts
window.replaceButtonsWithIcons = replaceButtonsWithIcons;

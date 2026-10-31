// Word Manager - Adds words to the signed-in user's collection one at a time, and lets them
// fix a translation or delete a word from the list.
class WordManager {
  constructor() {
    this.cards = [];
    this.form = document.getElementById("addWordForm");
    this.wordInput = document.getElementById("newWord");
    this.translationInput = document.getElementById("newTranslation");
    this.addButton = document.getElementById("addWordBtn");
    this.list = document.getElementById("wordList");

    document.addEventListener("i18n-changed", () => this.render());

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.addWord();
    });
  }

  async load() {
    this.cards = await window.Cloud.loadCards();
    this.render();
    this.wordInput.focus();
  }

  async addWord() {
    const word = this.wordInput.value.trim();
    const translation = this.translationInput.value.trim();
    if (!word) return;

    const existing = this.cards.find(
      (card) => card.word.toLowerCase() === word.toLowerCase()
    );
    if (existing) {
      this.showMessage(I18n.t("words.exists", { word: existing.word }), "info");
      return;
    }

    this.addButton.disabled = true;
    try {
      const id = await window.Cloud.addCard({ word, translation });
      this.cards.push({ id, word, translation });
      this.cards.sort((a, b) => a.word.localeCompare(b.word, "es"));
    } catch (error) {
      this.showMessage(I18n.t("words.addFailed", { word, error: error.message }), "error");
      return;
    } finally {
      this.addButton.disabled = false;
    }

    this.form.reset();
    this.wordInput.focus();
    this.render();
    this.showMessage(I18n.t("words.added", { word }), "success");
  }

  async updateTranslation(card, input) {
    const translation = input.value.trim();
    if (translation === card.translation) return;

    try {
      await window.Cloud.updateCard(card.id, { word: card.word, translation });
      card.translation = translation;
      this.showMessage(I18n.t("words.saved", { word: card.word }), "success");
    } catch (error) {
      input.value = card.translation;
      this.showMessage(
        I18n.t("words.saveFailed", { word: card.word, error: error.message }),
        "error"
      );
    }
  }

  async deleteWord(card, button) {
    if (!window.confirmOnSecondTap(button, I18n.t("words.deleteConfirm"))) return;

    try {
      await window.Cloud.deleteCard(card.id);
    } catch (error) {
      this.showMessage(
        I18n.t("words.deleteFailed", { word: card.word, error: error.message }),
        "error"
      );
      return;
    }
    this.cards = this.cards.filter((c) => c.id !== card.id);
    this.render();
    this.showMessage(I18n.t("words.deleted", { word: card.word }), "success");
  }

  render() {
    document.getElementById("wordCount").textContent = `(${this.cards.length})`;
    this.list.innerHTML = "";

    if (this.cards.length === 0) {
      const empty = document.createElement("li");
      empty.className = "word-list-empty";
      empty.textContent = I18n.t("words.empty");
      this.list.appendChild(empty);
      return;
    }

    this.cards.forEach((card) => {
      const item = document.createElement("li");
      item.className = "word-item";

      const word = document.createElement("span");
      word.className = "word-item-word";
      word.textContent = card.word;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "word-item-translation";
      input.lang = "ru";
      input.maxLength = 500;
      input.placeholder = I18n.t("words.translationPlaceholder");
      input.setAttribute("aria-label", I18n.t("words.translationColumn"));
      input.value = card.translation;
      input.addEventListener("change", () => this.updateTranslation(card, input));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "word-item-delete";
      deleteButton.title = I18n.t("words.delete");
      deleteButton.setAttribute("aria-label", `${I18n.t("words.delete")}: ${card.word}`);
      deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>`;
      deleteButton.addEventListener("click", () => this.deleteWord(card, deleteButton));

      item.append(word, input, deleteButton);
      this.list.appendChild(item);
    });
  }

  showMessage(text, type, duration = 3000) {
    const container = document.getElementById("messageContainer");
    const message = document.createElement("div");
    message.className = `${type}-message`;
    message.textContent = text;
    container.replaceChildren(message);
    if (duration > 0) {
      setTimeout(() => message.remove(), duration);
    }
  }
}

AuthGate.onSignedIn(() => {
  window.wordManager = new WordManager();
  return window.wordManager.load();
});

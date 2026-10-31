// Word Manager - Adds words to the signed-in user's collection one at a time, and lets them
// fix a translation or delete a word from the list.
class WordManager {
  constructor() {
    this.cards = [];
    this.form = document.getElementById("addWordForm");
    this.wordInput = document.getElementById("newWord");
    this.translationInput = document.getElementById("newTranslation");
    this.addButton = document.getElementById("addWordBtn");
    this.tableBody = document.getElementById("vocabTableBody");

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
      this.showMessage(`"${existing.word}" is already in your collection`, "info");
      return;
    }

    this.addButton.disabled = true;
    try {
      const id = await window.Cloud.addCard({ word, translation });
      this.cards.push({ id, word, translation });
      this.cards.sort((a, b) => a.word.localeCompare(b.word, "es"));
    } catch (error) {
      this.showMessage(`Could not add "${word}": ${error.message}`, "error");
      return;
    } finally {
      this.addButton.disabled = false;
    }

    this.form.reset();
    this.wordInput.focus();
    this.render();
    this.showMessage(`Added "${word}"`, "success");
  }

  async updateTranslation(card, input) {
    const translation = input.value.trim();
    if (translation === card.translation) return;

    try {
      await window.Cloud.updateCard(card.id, { word: card.word, translation });
      card.translation = translation;
      this.showMessage(`Saved the translation of "${card.word}"`, "success");
    } catch (error) {
      input.value = card.translation;
      this.showMessage(`Could not save "${card.word}": ${error.message}`, "error");
    }
  }

  async deleteWord(card, button) {
    if (!window.confirmOnSecondTap(button, "Sure?")) return;

    try {
      await window.Cloud.deleteCard(card.id);
    } catch (error) {
      this.showMessage(`Could not delete "${card.word}": ${error.message}`, "error");
      return;
    }
    this.cards = this.cards.filter((c) => c.id !== card.id);
    this.render();
    this.showMessage(`Deleted "${card.word}"`, "success");
  }

  render() {
    document.getElementById("wordCount").textContent = `(${this.cards.length})`;
    this.tableBody.innerHTML = "";

    if (this.cards.length === 0) {
      this.tableBody.innerHTML =
        '<tr><td colspan="3" class="empty-table-message">No words yet. Add your first word above.</td></tr>';
      return;
    }

    this.cards.forEach((card) => {
      const row = document.createElement("tr");

      const wordCell = document.createElement("td");
      wordCell.textContent = card.word;

      const translationCell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.className = "translation-input";
      input.lang = "ru";
      input.maxLength = 500;
      input.placeholder = "Add a translation";
      input.value = card.translation;
      input.addEventListener("change", () => this.updateTranslation(card, input));
      translationCell.appendChild(input);

      const actionsCell = document.createElement("td");
      actionsCell.className = "row-actions";
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => this.deleteWord(card, deleteButton));
      actionsCell.appendChild(deleteButton);

      row.append(wordCell, translationCell, actionsCell);
      this.tableBody.appendChild(row);
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

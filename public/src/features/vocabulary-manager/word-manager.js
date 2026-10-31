// Word Manager - The signed-in user's collections: pick one, create, rename, delete, import and
// export them as CSV, add words to them one at a time, fix a translation or delete a word.
class WordManager {
  constructor(user) {
    this.cards = [];
    this.collections = [];
    this.selectionKey = `flashcards-collection-${user.uid}`;
    this.selected = null;
    this.nameFormMode = null; // "new" or "rename" while the name form is open

    const $ = (id) => document.getElementById(id);
    this.collectionList = $("collectionList");
    this.form = $("addWordForm");
    this.wordInput = $("newWord");
    this.translationInput = $("newTranslation");
    this.addButton = $("addWordBtn");
    this.list = $("wordList");
    this.nameForm = $("collectionNameForm");
    this.nameInput = $("collectionNameInput");
    this.importPanel = $("importPanel");
    this.fileInput = $("importFileInput");
    this.deleteCollectionButton = $("deleteCollectionBtn");

    document.addEventListener("i18n-changed", () => this.render());
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.addWord();
    });

    $("newCollectionBtn").addEventListener("click", () => this.openNameForm("new"));
    $("renameCollectionBtn").addEventListener("click", () => this.openNameForm("rename"));
    $("collectionNameCancel").addEventListener("click", () => this.closeNameForm());
    this.nameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.saveCollectionName();
    });

    $("importBtn").addEventListener("click", () => this.toggleImportPanel());
    $("importFileBtn").addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", () => this.importFile());
    $("exportBtn").addEventListener("click", () => this.exportCollection());
    this.deleteCollectionButton.addEventListener("click", () => this.deleteCollection());
  }

  async load() {
    const [collections, cards] = await Promise.all([
      window.Cloud.loadCollections(I18n.t("collections.default")),
      window.Cloud.loadCards(),
    ]);
    this.collections = collections;
    this.cards = cards;

    // The collection being edited, remembered on this device
    let saved = null;
    try {
      saved = localStorage.getItem(this.selectionKey);
    } catch (error) {
      // Storage unavailable: start with the first collection
    }
    this.select(this.collections.some((c) => c.id === saved) ? saved : this.collections[0].id);
  }

  // --- Collections ---

  get current() {
    return this.collections.find((c) => c.id === this.selected);
  }

  cardsIn(collectionId) {
    return this.cards.filter((card) => card.collectionId === collectionId);
  }

  select(collectionId) {
    this.selected = collectionId;
    try {
      localStorage.setItem(this.selectionKey, collectionId);
    } catch (error) {
      // Not remembered, but the switch still applies
    }
    this.closeNameForm();
    this.render();
  }

  sortCollections() {
    this.collections.sort((a, b) => a.name.localeCompare(b.name));
  }

  async setActive(collection, active, checkbox) {
    collection.active = active;
    try {
      await window.Cloud.setCollectionActive(collection.id, active);
    } catch (error) {
      collection.active = !active;
      checkbox.checked = !active;
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
    }
  }

  openNameForm(mode) {
    this.nameFormMode = mode;
    this.importPanel.classList.add("hidden");
    this.nameForm.classList.remove("hidden");
    this.nameInput.value = mode === "rename" ? this.current.name : "";
    this.nameInput.placeholder = I18n.t("collections.namePlaceholder");
    this.nameInput.focus();
  }

  closeNameForm() {
    this.nameFormMode = null;
    this.nameForm.classList.add("hidden");
  }

  async saveCollectionName() {
    const name = this.nameInput.value.trim();
    if (!name) return;

    try {
      if (this.nameFormMode === "new") {
        const id = await window.Cloud.createCollection(name);
        this.collections.push({ id, name, active: true });
        this.sortCollections();
        this.select(id);
        this.showMessage(I18n.t("collections.created", { name }), "success");
        this.wordInput.focus();
      } else {
        await window.Cloud.renameCollection(this.current.id, name);
        this.current.name = name;
        this.sortCollections();
        this.closeNameForm();
        this.render();
        this.showMessage(I18n.t("collections.renamed", { name }), "success");
      }
    } catch (error) {
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
    }
  }

  async deleteCollection() {
    const collection = this.current;
    if (!window.confirmOnSecondTap(this.deleteCollectionButton, I18n.t("collections.deleteConfirm"))) {
      return;
    }

    const cardIds = this.cardsIn(collection.id).map((card) => card.id);
    try {
      await window.Cloud.deleteCollection(collection.id, cardIds);
    } catch (error) {
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
      return;
    }

    this.cards = this.cards.filter((card) => card.collectionId !== collection.id);
    this.collections = this.collections.filter((c) => c.id !== collection.id);
    if (this.collections.length === 0) {
      // There is always somewhere to put words: this recreates the default collection
      this.collections = await window.Cloud.loadCollections(I18n.t("collections.default"));
    }
    this.select(this.collections[0].id);
    this.showMessage(I18n.t("collections.deleted", { name: collection.name }), "success");
  }

  // --- Import and export ---

  async toggleImportPanel() {
    this.closeNameForm();
    const opening = this.importPanel.classList.toggle("hidden") === false;
    if (opening && !this.library) await this.loadLibrary();
  }

  async loadLibrary() {
    const list = document.getElementById("libraryList");
    try {
      const response = await fetch("collections/index.json");
      this.library = (await response.json()).collections;
    } catch (error) {
      this.library = [];
    }
    list.innerHTML = "";
    this.library.forEach((entry) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "library-item";
      const name = document.createElement("span");
      name.textContent = entry.name;
      const count = document.createElement("span");
      count.className = "library-count";
      count.textContent = I18n.t("collections.wordCount", { count: entry.words });
      button.append(name, count);
      button.addEventListener("click", () => this.importLibraryEntry(entry, button));
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  async importLibraryEntry(entry, button) {
    button.disabled = true;
    try {
      const response = await fetch(`collections/${entry.file}`);
      if (!response.ok) throw new Error(response.statusText);
      await this.importCards(entry.name, window.CsvUtils.toCards(await response.text()));
    } catch (error) {
      this.showMessage(I18n.t("collections.importFailed", { error: error.message }), "error");
    } finally {
      button.disabled = false;
    }
  }

  async importFile() {
    const file = this.fileInput.files[0];
    this.fileInput.value = "";
    if (!file) return;
    try {
      const cards = window.CsvUtils.toCards(await file.text());
      await this.importCards(file.name.replace(/\.csv$/i, ""), cards);
    } catch (error) {
      this.showMessage(I18n.t("collections.importFailed", { error: error.message }), "error");
    }
  }

  // An import always becomes a new collection, so nothing already there is touched
  async importCards(name, cards) {
    if (cards.length === 0) {
      this.showMessage(I18n.t("collections.importEmpty"), "error");
      return;
    }
    const id = await window.Cloud.createCollection(name);
    const added = await window.Cloud.importCards(id, cards);
    this.collections.push({ id, name, active: true });
    this.cards.push(...added);
    this.cards.sort((a, b) => a.word.localeCompare(b.word, "es"));
    this.sortCollections();
    this.importPanel.classList.add("hidden");
    this.select(id);
    this.showMessage(I18n.t("collections.imported", { name, count: added.length }), "success");
  }

  exportCollection() {
    const cards = this.cardsIn(this.selected);
    if (cards.length === 0) {
      this.showMessage(I18n.t("collections.exportEmpty"), "info");
      return;
    }
    const blob = new Blob([window.CsvUtils.fromCards(cards)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = window.CsvUtils.fileName(this.current.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // --- Words ---

  async addWord() {
    const word = this.wordInput.value.trim();
    const translation = this.translationInput.value.trim();
    if (!word) return;

    const existing = this.cardsIn(this.selected).find(
      (card) => card.word.toLowerCase() === word.toLowerCase()
    );
    if (existing) {
      this.showMessage(I18n.t("words.exists", { word: existing.word }), "info");
      return;
    }

    this.addButton.disabled = true;
    try {
      const card = { word, translation, collectionId: this.selected };
      const id = await window.Cloud.addCard(card);
      this.cards.push({ id, ...card });
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
      await window.Cloud.updateCard(card.id, { ...card, translation });
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

  // --- Rendering ---

  render() {
    if (!this.current) return;

    this.renderCollections();

    const cards = this.cardsIn(this.selected);
    document.getElementById("collectionTitle").textContent = this.current.name;
    document.getElementById("wordCount").textContent = `(${cards.length})`;
    this.list.innerHTML = "";

    if (cards.length === 0) {
      const empty = document.createElement("li");
      empty.className = "word-list-empty";
      empty.textContent = I18n.t("words.empty");
      this.list.appendChild(empty);
      return;
    }

    cards.forEach((card) => {
      const item = document.createElement("li");
      item.className = "word-item";

      const word = document.createElement("span");
      word.className = "word-item-word";
      word.textContent = card.word;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "word-item-translation";
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

  renderCollections() {
    this.collectionList.innerHTML = "";
    this.collections.forEach((collection) => {
      const item = document.createElement("li");
      item.className = "collection-row" + (collection.id === this.selected ? " selected" : "");

      // On/off for study
      const toggle = document.createElement("label");
      toggle.className = "switch";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = collection.active;
      checkbox.setAttribute("aria-label", I18n.t("collections.activeLabel", { name: collection.name }));
      checkbox.addEventListener("change", () => this.setActive(collection, checkbox.checked, checkbox));
      const track = document.createElement("span");
      track.className = "switch-track";
      toggle.append(checkbox, track);

      // Tapping the name opens the collection for editing below
      const name = document.createElement("button");
      name.type = "button";
      name.className = "collection-row-name";
      name.setAttribute("aria-pressed", String(collection.id === this.selected));
      const label = document.createElement("span");
      label.className = "collection-row-label";
      label.textContent = collection.name;
      const count = document.createElement("span");
      count.className = "collection-row-count";
      count.textContent = this.cardsIn(collection.id).length;
      name.append(label, count);
      name.addEventListener("click", () => this.select(collection.id));

      item.append(toggle, name);
      this.collectionList.appendChild(item);
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

AuthGate.onSignedIn((user) => {
  window.wordManager = new WordManager(user);
  return window.wordManager.load();
});

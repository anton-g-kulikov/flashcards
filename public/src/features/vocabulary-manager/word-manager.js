// Word Manager - The signed-in user's collections, one collapsible card each. A card's header
// switches the collection on or off for study, renames, exports or deletes it; its body adds
// words one at a time and lets you fix a translation or delete a word. Collections can also be
// created and imported from CSV (a file or a starter collection).

const ICONS = {
  chevron: '<polyline points="9 6 15 12 9 18"/>',
  rename: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  export:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  delete:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  save: '<polyline points="20 6 9 17 4 12"/>',
  cancel: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function iconButton(name, label, className = "icon-tool") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon(name);
  return button;
}

class WordManager {
  constructor(user) {
    this.cards = [];
    this.collections = [];
    this.renaming = null; // id of the collection whose name is being edited
    this.openKey = `flashcards-open-${user.uid}`;
    this.open = this.loadOpenState();

    const $ = (id) => document.getElementById(id);
    this.collectionList = $("collectionList");
    this.nameForm = $("collectionNameForm");
    this.nameInput = $("collectionNameInput");
    this.importPanel = $("importPanel");
    this.fileInput = $("importFileInput");

    document.addEventListener("i18n-changed", () => this.render());

    $("newCollectionBtn").addEventListener("click", () => this.openNameForm());
    $("collectionNameCancel").addEventListener("click", () => this.closeNameForm());
    this.nameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.createCollection();
    });

    $("importBtn").addEventListener("click", () => this.toggleImportPanel());
    $("importFileBtn").addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", () => this.importFile());
  }

  async load() {
    const [collections, cards] = await Promise.all([
      window.Cloud.loadCollections(I18n.t("collections.default")),
      window.Cloud.loadCards(),
    ]);
    this.collections = collections;
    this.cards = cards;
    // A first visit with a single collection opens it, so there is somewhere to type
    if (this.open === null) {
      this.open = new Set(collections.length === 1 ? [collections[0].id] : []);
    }
    this.render();
  }

  // --- State ---

  loadOpenState() {
    try {
      const saved = localStorage.getItem(this.openKey);
      return saved ? new Set(JSON.parse(saved)) : null;
    } catch (error) {
      return null;
    }
  }

  saveOpenState() {
    try {
      localStorage.setItem(this.openKey, JSON.stringify([...this.open]));
    } catch (error) {
      // Not remembered, but the cards still open and close
    }
  }

  cardsIn(collectionId) {
    return this.cards.filter((card) => card.collectionId === collectionId);
  }

  sortCollections() {
    this.collections.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortCards() {
    this.cards.sort((a, b) => a.word.localeCompare(b.word, "es"));
  }

  toggleOpen(collection) {
    if (this.open.has(collection.id)) {
      this.open.delete(collection.id);
    } else {
      this.open.add(collection.id);
    }
    this.saveOpenState();
    this.renderCollection(collection);
  }

  // Opens a collection and brings its card into view, ready for the first word
  reveal(collectionId) {
    this.open.add(collectionId);
    this.saveOpenState();
    this.render();
    const card = this.collectionList.querySelector(`[data-id="${collectionId}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "start" });
    card?.querySelector(".add-word-form input")?.focus({ preventScroll: true });
  }

  // --- Collections ---

  openNameForm() {
    this.importPanel.classList.add("hidden");
    this.nameForm.classList.remove("hidden");
    this.nameInput.value = "";
    this.nameInput.placeholder = I18n.t("collections.namePlaceholder");
    this.nameInput.focus();
  }

  closeNameForm() {
    this.nameForm.classList.add("hidden");
  }

  async createCollection() {
    const name = this.nameInput.value.trim();
    if (!name) return;
    try {
      const id = await window.Cloud.createCollection(name);
      this.collections.push({ id, name, active: true });
      this.sortCollections();
      this.closeNameForm();
      this.reveal(id);
      this.showMessage(I18n.t("collections.created", { name }), "success");
    } catch (error) {
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
    }
  }

  async renameCollection(collection, name) {
    name = name.trim();
    if (!name || name === collection.name) {
      this.stopRenaming(collection);
      return;
    }
    try {
      await window.Cloud.renameCollection(collection.id, name);
      collection.name = name;
      this.renaming = null;
      this.sortCollections();
      this.render();
      this.showMessage(I18n.t("collections.renamed", { name }), "success");
    } catch (error) {
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
    }
  }

  stopRenaming(collection) {
    this.renaming = null;
    this.renderCollection(collection);
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

  async deleteCollection(collection, button) {
    if (!window.confirmOnSecondTap(button, I18n.t("collections.deleteConfirm"))) return;

    const cardIds = this.cardsIn(collection.id).map((card) => card.id);
    try {
      await window.Cloud.deleteCollection(collection.id, cardIds);
    } catch (error) {
      this.showMessage(I18n.t("collections.saveFailed", { error: error.message }), "error");
      return;
    }

    this.cards = this.cards.filter((card) => card.collectionId !== collection.id);
    this.collections = this.collections.filter((c) => c.id !== collection.id);
    this.open.delete(collection.id);
    this.saveOpenState();
    if (this.collections.length === 0) {
      // There is always somewhere to put words: this recreates the default collection
      this.collections = await window.Cloud.loadCollections(I18n.t("collections.default"));
    }
    this.render();
    this.showMessage(I18n.t("collections.deleted", { name: collection.name }), "success");
  }

  exportCollection(collection) {
    const cards = this.cardsIn(collection.id);
    if (cards.length === 0) {
      this.showMessage(I18n.t("collections.exportEmpty"), "info");
      return;
    }
    const blob = new Blob([window.CsvUtils.fromCards(cards)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = window.CsvUtils.fileName(collection.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // --- Import ---

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
    // Saving waits for the server, so say something straight away
    this.showMessage(I18n.t("collections.importing", { name, count: cards.length }), "info", 0);
    const id = await window.Cloud.createCollection(name);
    const added = await window.Cloud.importCards(id, cards);
    this.collections.push({ id, name, active: true });
    this.cards.push(...added);
    this.sortCards();
    this.sortCollections();
    this.importPanel.classList.add("hidden");
    this.reveal(id);
    this.showMessage(I18n.t("collections.imported", { name, count: added.length }), "success");
  }

  // --- Words ---

  async addWord(collection, form) {
    const wordInput = form.elements.word;
    const word = wordInput.value.trim();
    const translation = form.elements.translation.value.trim();
    if (!word) return;

    const existing = this.cardsIn(collection.id).find(
      (card) => card.word.toLowerCase() === word.toLowerCase()
    );
    if (existing) {
      this.showMessage(I18n.t("words.exists", { word: existing.word }), "info");
      return;
    }

    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const card = { word, translation, collectionId: collection.id };
      const id = await window.Cloud.addCard(card);
      this.cards.push({ id, ...card });
      this.sortCards();
    } catch (error) {
      submit.disabled = false;
      this.showMessage(I18n.t("words.addFailed", { word, error: error.message }), "error");
      return;
    }

    const section = this.renderCollection(collection);
    section.querySelector(".add-word-form input").focus();
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
    this.renderCollection(this.collections.find((c) => c.id === card.collectionId));
    this.showMessage(I18n.t("words.deleted", { word: card.word }), "success");
  }

  // --- Rendering ---

  render() {
    this.collectionList.replaceChildren(...this.collections.map((c) => this.buildCollection(c)));
  }

  // Re-renders one card in place (keeps the rest of the page, and its scroll position, as is)
  renderCollection(collection) {
    const fresh = this.buildCollection(collection);
    const old = this.collectionList.querySelector(`[data-id="${collection.id}"]`);
    if (old) old.replaceWith(fresh);
    else this.collectionList.appendChild(fresh);
    return fresh;
  }

  buildCollection(collection) {
    const isOpen = this.open.has(collection.id);
    const cards = this.cardsIn(collection.id);

    const section = document.createElement("section");
    section.className = "panel collection" + (isOpen ? " open" : "");
    section.dataset.id = collection.id;

    const header = document.createElement("div");
    header.className = "collection-header";
    header.append(this.buildSwitch(collection));

    if (this.renaming === collection.id) {
      header.append(this.buildRenameForm(collection));
    } else {
      // The name opens and closes the card
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "collection-toggle";
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.innerHTML = `<span class="collection-chevron">${icon("chevron")}</span>`;
      const name = document.createElement("span");
      name.className = "collection-name";
      name.textContent = collection.name;
      const count = document.createElement("span");
      count.className = "collection-count";
      count.textContent = cards.length;
      toggle.append(name, count);
      toggle.addEventListener("click", () => this.toggleOpen(collection));

      const tools = document.createElement("div");
      tools.className = "collection-tools";
      const rename = iconButton("rename", I18n.t("collections.rename"));
      rename.addEventListener("click", () => {
        this.renaming = collection.id;
        this.renderCollection(collection).querySelector(".collection-rename input").focus();
      });
      const exportButton = iconButton("export", I18n.t("collections.export"));
      exportButton.addEventListener("click", () => this.exportCollection(collection));
      const remove = iconButton("delete", I18n.t("collections.delete"), "icon-tool icon-tool-danger");
      remove.addEventListener("click", () => this.deleteCollection(collection, remove));
      tools.append(rename, exportButton, remove);

      header.append(toggle, tools);
    }
    section.append(header);

    if (isOpen) {
      const body = document.createElement("div");
      body.className = "collection-body";
      body.append(this.buildAddForm(collection), this.buildWordList(cards));
      section.append(body);
    }
    return section;
  }

  buildSwitch(collection) {
    const toggle = document.createElement("label");
    toggle.className = "switch";
    toggle.title = I18n.t("collections.activeLabel", { name: collection.name });
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = collection.active;
    checkbox.setAttribute("aria-label", I18n.t("collections.activeLabel", { name: collection.name }));
    checkbox.addEventListener("change", () => this.setActive(collection, checkbox.checked, checkbox));
    const track = document.createElement("span");
    track.className = "switch-track";
    toggle.append(checkbox, track);
    return toggle;
  }

  buildRenameForm(collection) {
    const form = document.createElement("form");
    form.className = "collection-rename";
    form.autocomplete = "off";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 100;
    input.required = true;
    input.value = collection.name;
    input.setAttribute("aria-label", I18n.t("collections.namePlaceholder"));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.stopRenaming(collection);
    });
    const save = iconButton("save", I18n.t("collections.save"));
    save.type = "submit";
    const cancel = iconButton("cancel", I18n.t("collections.cancel"));
    cancel.addEventListener("click", () => this.stopRenaming(collection));
    form.append(input, save, cancel);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.renameCollection(collection, input.value);
    });
    return form;
  }

  buildAddForm(collection) {
    const form = document.createElement("form");
    form.className = "add-word-form";
    form.autocomplete = "off";

    const word = document.createElement("input");
    word.type = "text";
    word.name = "word";
    word.maxLength = 200;
    word.required = true;
    word.autocapitalize = "none";
    word.placeholder = I18n.t("words.wordPlaceholder");

    const translation = document.createElement("input");
    translation.type = "text";
    translation.name = "translation";
    translation.maxLength = 500;
    translation.autocapitalize = "none";
    translation.placeholder = I18n.t("words.translationPlaceholder");

    const add = document.createElement("button");
    add.type = "submit";
    add.className = "primary-btn";
    add.textContent = I18n.t("words.add");

    form.append(word, translation, add);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.addWord(collection, form);
    });
    return form;
  }

  buildWordList(cards) {
    const list = document.createElement("ul");
    list.className = "word-list";

    if (cards.length === 0) {
      const empty = document.createElement("li");
      empty.className = "word-list-empty";
      empty.textContent = I18n.t("words.empty");
      list.appendChild(empty);
      return list;
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

      const remove = iconButton("delete", I18n.t("words.delete"), "word-item-delete");
      remove.setAttribute("aria-label", `${I18n.t("words.delete")}: ${card.word}`);
      remove.addEventListener("click", () => this.deleteWord(card, remove));

      item.append(word, input, remove);
      list.appendChild(item);
    });
    return list;
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

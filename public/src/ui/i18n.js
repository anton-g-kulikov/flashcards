// Interface language: English, Russian and Spanish.
//
// Static text is marked in the HTML with data-i18n (text), data-i18n-html (trusted markup from
// this file) and data-i18n-placeholder. Scripts call I18n.t(key, vars) for the text they build.
// Switching language re-applies the static text and fires "i18n-changed" so pages can re-render.
// The choice is remembered on this device; the first visit follows the browser's language.

const TRANSLATIONS = {
  en: {
    "app.title": "YourCards",
    "auth.tagline":
      "Your personal vocabulary collection. Add your own words, then learn them with flashcards and quizzes on any device.",
    "auth.signIn": "Sign in with Google",
    "auth.signOut": "Sign out",
    "auth.language": "Language",
    "auth.signedIn": "Signed in",
    "auth.signInFailed": "Sign-in failed: {error}",
    "auth.loadFailed": "Could not load your words.",
    "auth.loadSlow": "Loading your words is taking longer than usual.",
    "auth.retry": "Try again",
    "study.subtitle": 'Your personal collection · <a href="vocabulary-manager.html">Add words</a>',
    "study.empty":
      'Nothing to study yet. <a href="vocabulary-manager.html">Add words, import a collection or switch one on</a> in My Cards.',
    "mode.flashcards": "Flashcards",
    "mode.quiz": "Quiz Mode",
    "progress.reset": "Reset Progress",
    "progress.resetConfirm": "Tap again to reset these words",
    "progress.resetFailed": "There was an error resetting progress. Please try again.",
    "stats.cards": "Cards",
    "stats.inCollection": "In your collection",
    "stats.known": "Known",
    "stats.unknown": "Unknown",
    "card.dontKnow": "I Don't Know...",
    "card.know": "I Know This!",
    "card.noTranslation": "No translation yet",
    "card.loading": "Loading cards...",
    "card.wait": "Please wait",
    "flash.complete.badge": "🎉 Congratulations!",
    "flash.complete.title": "All cards learned!",
    "flash.complete.next": "What would you like to do next?",
    "flash.complete.hint":
      "Add new words in My Cards, or reset your progress to review everything you've learned.",
    "flash.none.title": "No cards to study yet",
    "flash.none.hint": 'Add your first words in <a href="vocabulary-manager.html">My Cards</a>.',
    "quiz.loading": "Loading quiz...",
    "quiz.question": "What does “{word}” mean?",
    "quiz.needTwo.title": "A quiz needs at least 2 unknown words with a translation.",
    "quiz.needTwo.count": "You have {count} right now.",
    "quiz.needTwo.hint":
      "Add words or translations in My Cards, or reset your progress to review known words.",
    "quiz.notUnique.badge": "⚠️ Not enough unique translations",
    "quiz.notUnique.title": "Not enough unique cards available",
    "quiz.notUnique.next": "Switch to flashcard mode or add more words.",
    "quiz.notUnique.hint": "Add more words with different translations in My Cards.",
    "quiz.complete.badge": "🎉 Quiz Complete!",
    "quiz.complete.title": "Well done!",
    "quiz.complete.next": "You know all your words!",
    "quiz.complete.hint": "Add new words in My Cards, or reset your progress to review them again.",
    "quiz.last.badge": "🎉 Almost done!",
    "quiz.last.title": "One card remaining",
    "quiz.last.next": "Switching to flashcard mode...",
    "quiz.last.hint": "Perfect for reviewing the last word: “{word}”",
    "footer.version": "Version: {version}",
    "footer.words": "Vocabulary: {count} words",
    "footer.coffee": "Find this useful? Buy me a coffee! ☕️ :)",
    "pwa.install": "Install App",
    "words.title": "My Cards",
    "words.back": "Back to Study",
    "words.addTitle": "Add a Word",
    "words.wordPlaceholder": "Word",
    "words.translationPlaceholder": "Translation",
    "words.add": "Add",
    "words.collection": "My Collection",
    "words.wordColumn": "Word",
    "words.translationColumn": "Translation",
    "words.addTranslation": "Add a translation",
    "words.delete": "Delete",
    "words.deleteConfirm": "Sure?",
    "words.empty": "No words yet. Add your first word above.",
    "words.exists": "“{word}” is already in your collection",
    "words.added": "Added “{word}”",
    "words.addFailed": "Could not add “{word}”: {error}",
    "words.saved": "Saved the translation of “{word}”",
    "words.saveFailed": "Could not save “{word}”: {error}",
    "words.deleted": "Deleted “{word}”",
    "words.deleteFailed": "Could not delete “{word}”: {error}",
    "collections.default": "My words",
    "collections.all": "All words",
    "collections.label": "Collection",
    "collections.title": "Collections",
    "collections.activeHint": "Study uses the collections that are switched on.",
    "collections.activeLabel": "Study “{name}”",
    "collections.new": "New",
    "collections.rename": "Rename",
    "collections.import": "Import",
    "collections.export": "Export",
    "collections.delete": "Delete",
    "collections.deleteConfirm": "Delete?",
    "collections.cancel": "Cancel",
    "collections.save": "Save",
    "collections.namePlaceholder": "Collection name",
    "collections.created": "Created “{name}”",
    "collections.renamed": "Renamed to “{name}”",
    "collections.deleted": "Deleted “{name}”",
    "collections.saveFailed": "Could not save: {error}",
    "collections.importHint": "A CSV file with the columns word,translation becomes a new collection.",
    "collections.importFile": "Choose a CSV file",
    "collections.library": "Starter collections",
    "collections.wordCount": "{count} words",
    "collections.imported": "Imported “{name}”: {count} words",
    "collections.importing": "Importing “{name}” ({count} words)…",
    "collections.importFailed": "Could not import: {error}",
    "collections.importEmpty": "No words found in that file",
    "collections.exportEmpty": "This collection is empty — nothing to export",
  },

  ru: {
    "app.title": "YourCards",
    "auth.tagline":
      "Ваша личная коллекция слов. Добавляйте свои слова и учите их с помощью карточек и тестов на любом устройстве.",
    "auth.signIn": "Войти через Google",
    "auth.signOut": "Выйти",
    "auth.language": "Язык",
    "auth.signedIn": "Вы вошли",
    "auth.signInFailed": "Не удалось войти: {error}",
    "auth.loadFailed": "Не удалось загрузить слова.",
    "auth.loadSlow": "Слова загружаются дольше обычного.",
    "auth.retry": "Попробовать снова",
    "study.subtitle": 'Ваша личная коллекция · <a href="vocabulary-manager.html">Добавить слова</a>',
    "study.empty":
      'Пока нечего учить. <a href="vocabulary-manager.html">Добавьте слова, импортируйте или включите коллекцию</a> в разделе «Мои карточки».',
    "mode.flashcards": "Карточки",
    "mode.quiz": "Тест",
    "progress.reset": "Сбросить прогресс",
    "progress.resetConfirm": "Нажмите ещё раз, чтобы сбросить эти слова",
    "progress.resetFailed": "Не удалось сбросить прогресс. Попробуйте ещё раз.",
    "stats.cards": "Карточки",
    "stats.inCollection": "В вашей коллекции",
    "stats.known": "Знаю",
    "stats.unknown": "Не знаю",
    "card.dontKnow": "Не знаю...",
    "card.know": "Знаю!",
    "card.noTranslation": "Перевода пока нет",
    "card.loading": "Загрузка карточек...",
    "card.wait": "Подождите",
    "flash.complete.badge": "🎉 Поздравляем!",
    "flash.complete.title": "Все карточки выучены!",
    "flash.complete.next": "Что дальше?",
    "flash.complete.hint":
      "Добавьте новые слова в разделе «Мои карточки» или сбросьте прогресс, чтобы повторить выученное.",
    "flash.none.title": "Пока нечего учить",
    "flash.none.hint": 'Добавьте первые слова в разделе <a href="vocabulary-manager.html">«Мои карточки»</a>.',
    "quiz.loading": "Загрузка теста...",
    "quiz.question": "Что значит «{word}»?",
    "quiz.needTwo.title": "Для теста нужно хотя бы 2 невыученных слова с переводом.",
    "quiz.needTwo.count": "Сейчас таких слов: {count}.",
    "quiz.needTwo.hint":
      "Добавьте слова или переводы в разделе «Мои карточки» или сбросьте прогресс, чтобы повторить выученное.",
    "quiz.notUnique.badge": "⚠️ Мало разных переводов",
    "quiz.notUnique.title": "Недостаточно разных карточек",
    "quiz.notUnique.next": "Перейдите к карточкам или добавьте больше слов.",
    "quiz.notUnique.hint": "Добавьте в разделе «Мои карточки» больше слов с разными переводами.",
    "quiz.complete.badge": "🎉 Тест пройден!",
    "quiz.complete.title": "Отлично!",
    "quiz.complete.next": "Вы знаете все свои слова!",
    "quiz.complete.hint":
      "Добавьте новые слова в разделе «Мои карточки» или сбросьте прогресс, чтобы повторить их.",
    "quiz.last.badge": "🎉 Почти готово!",
    "quiz.last.title": "Осталась одна карточка",
    "quiz.last.next": "Переходим к карточкам...",
    "quiz.last.hint": "Самое время повторить последнее слово: «{word}»",
    "footer.version": "Версия: {version}",
    "footer.words": "Слов в коллекции: {count}",
    "footer.coffee": "Пригодилось? Угостите меня кофе! ☕️ :)",
    "pwa.install": "Установить приложение",
    "words.title": "Мои карточки",
    "words.back": "К занятиям",
    "words.addTitle": "Добавить слово",
    "words.wordPlaceholder": "Слово",
    "words.translationPlaceholder": "Перевод",
    "words.add": "Добавить",
    "words.collection": "Моя коллекция",
    "words.wordColumn": "Слово",
    "words.translationColumn": "Перевод",
    "words.addTranslation": "Добавьте перевод",
    "words.delete": "Удалить",
    "words.deleteConfirm": "Точно?",
    "words.empty": "Слов пока нет. Добавьте первое слово выше.",
    "words.exists": "«{word}» уже есть в вашей коллекции",
    "words.added": "Добавлено: «{word}»",
    "words.addFailed": "Не удалось добавить «{word}»: {error}",
    "words.saved": "Перевод слова «{word}» сохранён",
    "words.saveFailed": "Не удалось сохранить «{word}»: {error}",
    "words.deleted": "Удалено: «{word}»",
    "words.deleteFailed": "Не удалось удалить «{word}»: {error}",
    "collections.default": "Мои слова",
    "collections.all": "Все слова",
    "collections.label": "Коллекция",
    "collections.title": "Коллекции",
    "collections.activeHint": "Для занятий используются включённые коллекции.",
    "collections.activeLabel": "Учить «{name}»",
    "collections.new": "Новая",
    "collections.rename": "Переименовать",
    "collections.import": "Импорт",
    "collections.export": "Экспорт",
    "collections.delete": "Удалить",
    "collections.deleteConfirm": "Удалить?",
    "collections.cancel": "Отмена",
    "collections.save": "Сохранить",
    "collections.namePlaceholder": "Название коллекции",
    "collections.created": "Коллекция «{name}» создана",
    "collections.renamed": "Переименовано в «{name}»",
    "collections.deleted": "Коллекция «{name}» удалена",
    "collections.saveFailed": "Не удалось сохранить: {error}",
    "collections.importHint": "CSV-файл со столбцами word,translation станет новой коллекцией.",
    "collections.importFile": "Выбрать CSV-файл",
    "collections.library": "Готовые коллекции",
    "collections.wordCount": "Слов: {count}",
    "collections.imported": "Импортировано «{name}», слов: {count}",
    "collections.importing": "Импортируем «{name}» (слов: {count})…",
    "collections.importFailed": "Не удалось импортировать: {error}",
    "collections.importEmpty": "В файле не найдено слов",
    "collections.exportEmpty": "Коллекция пуста — нечего экспортировать",
  },

  es: {
    "app.title": "YourCards",
    "auth.tagline":
      "Tu colección personal de vocabulario. Añade tus propias palabras y apréndelas con tarjetas y tests en cualquier dispositivo.",
    "auth.signIn": "Iniciar sesión con Google",
    "auth.signOut": "Cerrar sesión",
    "auth.language": "Idioma",
    "auth.signedIn": "Sesión iniciada",
    "auth.signInFailed": "No se pudo iniciar sesión: {error}",
    "auth.loadFailed": "No se pudieron cargar tus palabras.",
    "auth.loadSlow": "Tus palabras están tardando más de lo normal en cargar.",
    "auth.retry": "Reintentar",
    "study.subtitle": 'Tu colección personal · <a href="vocabulary-manager.html">Añadir palabras</a>',
    "study.empty":
      'Aún no hay nada que estudiar. <a href="vocabulary-manager.html">Añade palabras, importa o activa una colección</a> en Mis tarjetas.',
    "mode.flashcards": "Tarjetas",
    "mode.quiz": "Test",
    "progress.reset": "Reiniciar progreso",
    "progress.resetConfirm": "Pulsa otra vez para reiniciar estas palabras",
    "progress.resetFailed": "No se pudo reiniciar el progreso. Inténtalo de nuevo.",
    "stats.cards": "Tarjetas",
    "stats.inCollection": "En tu colección",
    "stats.known": "Sabidas",
    "stats.unknown": "Por aprender",
    "card.dontKnow": "No la sé...",
    "card.know": "¡La sé!",
    "card.noTranslation": "Aún sin traducción",
    "card.loading": "Cargando tarjetas...",
    "card.wait": "Espera un momento",
    "flash.complete.badge": "🎉 ¡Enhorabuena!",
    "flash.complete.title": "¡Has aprendido todas las tarjetas!",
    "flash.complete.next": "¿Qué quieres hacer ahora?",
    "flash.complete.hint":
      "Añade palabras nuevas en Mis tarjetas o reinicia tu progreso para repasar todo lo aprendido.",
    "flash.none.title": "Aún no hay tarjetas para estudiar",
    "flash.none.hint": 'Añade tus primeras palabras en <a href="vocabulary-manager.html">Mis tarjetas</a>.',
    "quiz.loading": "Cargando test...",
    "quiz.question": "¿Qué significa «{word}»?",
    "quiz.needTwo.title": "Un test necesita al menos 2 palabras por aprender con traducción.",
    "quiz.needTwo.count": "Ahora tienes {count}.",
    "quiz.needTwo.hint":
      "Añade palabras o traducciones en Mis tarjetas, o reinicia tu progreso para repasar las que ya sabes.",
    "quiz.notUnique.badge": "⚠️ Pocas traducciones distintas",
    "quiz.notUnique.title": "No hay suficientes tarjetas distintas",
    "quiz.notUnique.next": "Cambia al modo tarjetas o añade más palabras.",
    "quiz.notUnique.hint": "Añade en Mis tarjetas más palabras con traducciones distintas.",
    "quiz.complete.badge": "🎉 ¡Test completado!",
    "quiz.complete.title": "¡Felicidades!",
    "quiz.complete.next": "¡Te sabes todas tus palabras!",
    "quiz.complete.hint":
      "Añade palabras nuevas en Mis tarjetas o reinicia tu progreso para repasarlas.",
    "quiz.last.badge": "🎉 ¡Casi listo!",
    "quiz.last.title": "Queda una tarjeta",
    "quiz.last.next": "Pasando al modo tarjetas...",
    "quiz.last.hint": "Perfecto para repasar la última palabra: «{word}»",
    "footer.version": "Versión: {version}",
    "footer.words": "Vocabulario: {count} palabras",
    "footer.coffee": "¿Te resulta útil? ¡Invítame a un café! ☕️ :)",
    "pwa.install": "Instalar la app",
    "words.title": "Mis tarjetas",
    "words.back": "Volver a estudiar",
    "words.addTitle": "Añadir una palabra",
    "words.wordPlaceholder": "Palabra",
    "words.translationPlaceholder": "Traducción",
    "words.add": "Añadir",
    "words.collection": "Mi colección",
    "words.wordColumn": "Palabra",
    "words.translationColumn": "Traducción",
    "words.addTranslation": "Añade una traducción",
    "words.delete": "Eliminar",
    "words.deleteConfirm": "¿Seguro?",
    "words.empty": "Aún no hay palabras. Añade la primera arriba.",
    "words.exists": "«{word}» ya está en tu colección",
    "words.added": "Añadida: «{word}»",
    "words.addFailed": "No se pudo añadir «{word}»: {error}",
    "words.saved": "Se guardó la traducción de «{word}»",
    "words.saveFailed": "No se pudo guardar «{word}»: {error}",
    "words.deleted": "Eliminada: «{word}»",
    "words.deleteFailed": "No se pudo eliminar «{word}»: {error}",
    "collections.default": "Mis palabras",
    "collections.all": "Todas las palabras",
    "collections.label": "Colección",
    "collections.title": "Colecciones",
    "collections.activeHint": "Para estudiar se usan las colecciones activadas.",
    "collections.activeLabel": "Estudiar «{name}»",
    "collections.new": "Nueva",
    "collections.rename": "Renombrar",
    "collections.import": "Importar",
    "collections.export": "Exportar",
    "collections.delete": "Eliminar",
    "collections.deleteConfirm": "¿Eliminar?",
    "collections.cancel": "Cancelar",
    "collections.save": "Guardar",
    "collections.namePlaceholder": "Nombre de la colección",
    "collections.created": "Colección «{name}» creada",
    "collections.renamed": "Renombrada a «{name}»",
    "collections.deleted": "Colección «{name}» eliminada",
    "collections.saveFailed": "No se pudo guardar: {error}",
    "collections.importHint": "Un archivo CSV con las columnas word,translation se convierte en una colección nueva.",
    "collections.importFile": "Elegir un archivo CSV",
    "collections.library": "Colecciones iniciales",
    "collections.wordCount": "{count} palabras",
    "collections.imported": "Importada «{name}»: {count} palabras",
    "collections.importing": "Importando «{name}» ({count} palabras)…",
    "collections.importFailed": "No se pudo importar: {error}",
    "collections.importEmpty": "No se encontraron palabras en el archivo",
    "collections.exportEmpty": "La colección está vacía: no hay nada que exportar",
  },
};

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "es", label: "ES", name: "Español" },
];
const STORAGE_KEY = "flashcards-ui-language";

class I18n {
  static lang = I18n.initialLanguage();

  static initialLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (TRANSLATIONS[saved]) return saved;
    } catch (error) {
      // Storage can be unavailable (private mode); fall back to the browser's language
    }
    const preferred = (navigator.languages || [navigator.language || "en"])
      .map((code) => code.slice(0, 2).toLowerCase())
      .find((code) => TRANSLATIONS[code]);
    return preferred || "en";
  }

  static t(key, vars = {}) {
    const text = TRANSLATIONS[I18n.lang][key] ?? TRANSLATIONS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) =>
      name in vars ? String(vars[name]) : match
    );
  }

  static escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  static setLanguage(lang) {
    if (!TRANSLATIONS[lang] || lang === I18n.lang) return;
    I18n.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      // Not remembered across visits, but the switch still applies now
    }
    I18n.apply();
    document.dispatchEvent(new CustomEvent("i18n-changed", { detail: { lang } }));
  }

  static apply(root = document) {
    document.documentElement.lang = I18n.lang;
    document.title = I18n.t(document.body?.classList.contains("vocab-manager-page") ? "words.title" : "app.title");

    root.querySelectorAll("[data-i18n]").forEach((el) => {
      // Buttons that icons.js decorated keep their icon; the label sits in the inner span
      const target = el.querySelector(":scope > span") || el;
      target.textContent = I18n.t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = I18n.t(el.dataset.i18nHtml);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = I18n.t(el.dataset.i18nPlaceholder);
    });
    // Icon-only buttons: the label is their tooltip and accessible name
    root.querySelectorAll("[data-i18n-label]").forEach((el) => {
      const label = I18n.t(el.dataset.i18nLabel);
      el.title = label;
      el.setAttribute("aria-label", label);
    });
    I18n.renderSwitchers(root);
  }

  // data-lang-switcher="select" renders a dropdown (the header); otherwise a row of buttons
  static renderSwitchers(root = document) {
    root.querySelectorAll("[data-lang-switcher]").forEach((container) => {
      container.innerHTML = "";
      if (container.dataset.langSwitcher === "select") {
        const select = document.createElement("select");
        select.className = "lang-select";
        select.setAttribute("aria-label", I18n.t("auth.language"));
        // Short codes keep the header compact; the full name is the option's tooltip
        LANGUAGES.forEach(({ code, label, name }) => {
          const option = new Option(label, code, false, code === I18n.lang);
          option.title = name;
          select.add(option);
        });
        select.addEventListener("change", () => I18n.setLanguage(select.value));
        container.appendChild(select);
        return;
      }

      container.setAttribute("role", "group");
      container.setAttribute("aria-label", I18n.t("auth.language"));
      LANGUAGES.forEach(({ code, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "lang-option" + (code === I18n.lang ? " active" : "");
        button.textContent = label;
        button.setAttribute("aria-pressed", String(code === I18n.lang));
        button.addEventListener("click", () => I18n.setLanguage(code));
        container.appendChild(button);
      });
    });
  }
}

window.I18n = I18n;
I18n.apply();
document.addEventListener("DOMContentLoaded", () => I18n.apply());

// Interface language: English, Russian and Spanish.
//
// Static text is marked in the HTML with data-i18n (text), data-i18n-html (trusted markup from
// this file) and data-i18n-placeholder. Scripts call I18n.t(key, vars) for the text they build.
// Switching language re-applies the static text and fires "i18n-changed" so pages can re-render.
// The choice is remembered on this device; the first visit follows the browser's language.

const TRANSLATIONS = {
  en: {
    "app.title": "YourCards",
    "app.titleLong": "YourFlashCards",
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
    "study.empty":
      'Nothing to study yet. <a href="vocabulary-manager.html">Add words, import a collection or switch one on</a> in My Cards.',
    "mode.flashcards": "Flash Mode",
    "mode.quiz": "Quiz Mode",
    "progress.reset": "Reset Progress",
    "progress.resetConfirm": "Tap again to reset these words",
    "card.dontKnow": "I Don't Know...",
    "card.know": "I Know This!",
    "card.noTranslation": "No translation yet",
    "flash.none.title": "No cards to study yet",
    "flash.none.hint": 'Add your first words in <a href="vocabulary-manager.html">My Cards</a>.',
    "quiz.loading": "Loading quiz...",
    "stats.due": "Due",
    "stats.learning": "Learning",
    "stats.mastered": "Mastered",
    "srs.caughtUp.badge": "🎉 All caught up!",
    "srs.caughtUp.title": "Nothing due right now",
    "srs.caughtUp.next": "Next review {when}.",
    "srs.caughtUp.hint": "Words come back at growing intervals. Add new words in My Cards, or come back then.",
    "quiz.needTwo.title": "A quiz needs at least 2 words with different translations.",
    "quiz.needTwo.count": "You have {count} right now.",
    "quiz.needTwo.hint": 'Add words or translations in <a href="vocabulary-manager.html">My Cards</a>.',
    "quiz.untranslated.title": "The words due now have no translation",
    "quiz.untranslated.hint": 'Study them in Flash Mode, or add translations in <a href="vocabulary-manager.html">My Cards</a>.',
    "quiz.question": "What does “{word}” mean?",
    "theme.label": "Appearance",
    "theme.system": "Match the device",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "cookies.note": "YourFlashCards uses Google Analytics cookies to see which features get used.",
    "cookies.turnOff": "Turn off analytics",
    "cookies.off": "Analytics is off on this device.",
    "cookies.turnOn": "Turn it back on",
    "footer.version": "Version: {version}",
    "footer.words": "Vocabulary: {count} words",
    "footer.coffee": "Find this useful? Buy me a coffee! ☕️ :)",
    "footer.privacy": "Privacy",
    "pwa.install": "Install App",
    "words.title": "My Cards",
    "words.back": "Back to Study",
    "words.wordPlaceholder": "Word",
    "words.translationPlaceholder": "Translation",
    "words.add": "Add",
    "words.translationColumn": "Translation",
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
    "collections.importShortened": "{count} words or translations were too long and were cut short (200 characters for a word, 500 for a translation).",
    "words.collectionFull": "this collection is full ({max} words); start a new one for more",
    "collections.importSkipped": "Skipped {count} rows with no word or a repeated word.",
    "collections.importTruncated": "Only the first {max} words fit; {count} more were left out.",
    "collections.exportEmpty": "This collection is empty — nothing to export",
  },

  ru: {
    "app.title": "YourCards",
    "app.titleLong": "YourFlashCards",
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
    "study.empty":
      'Пока нечего учить. <a href="vocabulary-manager.html">Добавьте слова, импортируйте или включите коллекцию</a> в разделе «Мои карточки».',
    "mode.flashcards": "Карточки",
    "mode.quiz": "Тест",
    "progress.reset": "Сбросить прогресс",
    "progress.resetConfirm": "Нажмите ещё раз, чтобы сбросить эти слова",
    "card.dontKnow": "Не знаю...",
    "card.know": "Знаю!",
    "card.noTranslation": "Перевода пока нет",
    "flash.none.title": "Пока нечего учить",
    "flash.none.hint": 'Добавьте первые слова в разделе <a href="vocabulary-manager.html">«Мои карточки»</a>.',
    "quiz.loading": "Загрузка теста...",
    "stats.due": "К повтору",
    "stats.learning": "Изучаются",
    "stats.mastered": "Выучены",
    "srs.caughtUp.badge": "🎉 Всё повторено!",
    "srs.caughtUp.title": "Сейчас повторять нечего",
    "srs.caughtUp.next": "Следующее повторение {when}.",
    "srs.caughtUp.hint": "Слова возвращаются через всё большие промежутки. Добавьте новые слова в разделе «Мои карточки» или возвращайтесь позже.",
    "quiz.needTwo.title": "Для теста нужно хотя бы 2 слова с разными переводами.",
    "quiz.needTwo.count": "Сейчас таких: {count}.",
    "quiz.needTwo.hint": 'Добавьте слова или переводы в разделе <a href="vocabulary-manager.html">«Мои карточки»</a>.',
    "quiz.untranslated.title": "У слов к повтору нет перевода",
    "quiz.untranslated.hint": 'Повторите их в режиме карточек или добавьте переводы в разделе <a href="vocabulary-manager.html">«Мои карточки»</a>.',
    "quiz.question": "Что значит «{word}»?",
    "theme.label": "Оформление",
    "theme.system": "Как на устройстве",
    "theme.light": "Светлая",
    "theme.dark": "Тёмная",
    "cookies.note": "YourFlashCards использует cookie Google Analytics, чтобы понимать, какими функциями пользуются.",
    "cookies.turnOff": "Отключить аналитику",
    "cookies.off": "Аналитика на этом устройстве отключена.",
    "cookies.turnOn": "Включить снова",
    "footer.version": "Версия: {version}",
    "footer.words": "Слов в коллекции: {count}",
    "footer.coffee": "Пригодилось? Угостите меня кофе! ☕️ :)",
    "footer.privacy": "Конфиденциальность",
    "pwa.install": "Установить приложение",
    "words.title": "Мои карточки",
    "words.back": "К занятиям",
    "words.wordPlaceholder": "Слово",
    "words.translationPlaceholder": "Перевод",
    "words.add": "Добавить",
    "words.translationColumn": "Перевод",
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
    "collections.importShortened": "Слишком длинные слова или переводы обрезаны: {count} (до 200 символов для слова, 500 для перевода).",
    "words.collectionFull": "коллекция заполнена ({max} слов), создайте новую",
    "collections.importSkipped": "Пропущено строк без слова или с повтором: {count}.",
    "collections.importTruncated": "Поместились только первые {max} слов; ещё {count} не вошли.",
    "collections.exportEmpty": "Коллекция пуста — нечего экспортировать",
  },

  es: {
    "app.title": "YourCards",
    "app.titleLong": "YourFlashCards",
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
    "study.empty":
      'Aún no hay nada que estudiar. <a href="vocabulary-manager.html">Añade palabras, importa o activa una colección</a> en Mis tarjetas.',
    "mode.flashcards": "Tarjetas",
    "mode.quiz": "Test",
    "progress.reset": "Reiniciar progreso",
    "progress.resetConfirm": "Pulsa otra vez para reiniciar estas palabras",
    "card.dontKnow": "No la sé...",
    "card.know": "¡La sé!",
    "card.noTranslation": "Aún sin traducción",
    "flash.none.title": "Aún no hay tarjetas para estudiar",
    "flash.none.hint": 'Añade tus primeras palabras en <a href="vocabulary-manager.html">Mis tarjetas</a>.',
    "quiz.loading": "Cargando test...",
    "stats.due": "Pendientes",
    "stats.learning": "Aprendiendo",
    "stats.mastered": "Dominadas",
    "srs.caughtUp.badge": "🎉 ¡Todo al día!",
    "srs.caughtUp.title": "No hay nada pendiente ahora",
    "srs.caughtUp.next": "Próximo repaso {when}.",
    "srs.caughtUp.hint": "Las palabras vuelven a intervalos cada vez más largos. Añade palabras nuevas en Mis tarjetas o vuelve entonces.",
    "quiz.needTwo.title": "Un test necesita al menos 2 palabras con traducciones distintas.",
    "quiz.needTwo.count": "Ahora tienes {count}.",
    "quiz.needTwo.hint": 'Añade palabras o traducciones en <a href="vocabulary-manager.html">Mis tarjetas</a>.',
    "quiz.untranslated.title": "Las palabras pendientes no tienen traducción",
    "quiz.untranslated.hint": 'Repásalas en Tarjetas o añade traducciones en <a href="vocabulary-manager.html">Mis tarjetas</a>.',
    "quiz.question": "¿Qué significa «{word}»?",
    "theme.label": "Apariencia",
    "theme.system": "Igual que el dispositivo",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "cookies.note": "YourFlashCards usa cookies de Google Analytics para saber qué funciones se usan.",
    "cookies.turnOff": "Desactivar la analítica",
    "cookies.off": "La analítica está desactivada en este dispositivo.",
    "cookies.turnOn": "Volver a activarla",
    "footer.version": "Versión: {version}",
    "footer.words": "Vocabulario: {count} palabras",
    "footer.coffee": "¿Te resulta útil? ¡Invítame a un café! ☕️ :)",
    "footer.privacy": "Privacidad",
    "pwa.install": "Instalar la app",
    "words.title": "Mis tarjetas",
    "words.back": "Volver a estudiar",
    "words.wordPlaceholder": "Palabra",
    "words.translationPlaceholder": "Traducción",
    "words.add": "Añadir",
    "words.translationColumn": "Traducción",
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
    "collections.importShortened": "Se recortaron {count} palabras o traducciones demasiado largas (200 caracteres por palabra, 500 por traducción).",
    "words.collectionFull": "la colección está llena ({max} palabras); crea otra para seguir",
    "collections.importSkipped": "Se omitieron {count} filas sin palabra o con una palabra repetida.",
    "collections.importTruncated": "Solo caben las primeras {max} palabras; quedaron fuera {count} más.",
    "collections.exportEmpty": "La colección está vacía: no hay nada que exportar",
  },
};

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "es", label: "ES", name: "Español" },
];
const STORAGE_KEY = "flashcards-ui-language";

export class I18n {
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
    document.title = I18n.t(document.body?.classList.contains("vocab-manager-page") ? "words.title" : "app.titleLong");

    root.querySelectorAll("[data-i18n]").forEach((el) => {
      // Buttons with an icon keep it; their label sits in the inner span
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

// Modules run once the page is parsed, so the static text can be translated straight away
I18n.apply();

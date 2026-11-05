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
    "card.next": "Next",
    "card.speak": "Read aloud",
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
    "account.title": "Account",
    "account.deleteHint": "Deletes your collections, your progress and your sign-in. This can't be undone, so export any collection you want to keep first.",
    "account.delete": "Delete my account",
    "account.deleteConfirm": "Tap again to delete everything",
    "account.deleting": "Deleting your account…",
    "account.deleteFailed": "Could not delete your account: {error}",
    "account.signInAgain": "please sign out, sign in again, and delete it within a few minutes",
    "account.deleted": "Your account and all your words were deleted.",
    "footer.expand": "Show settings and info",
    "footer.collapse": "Hide settings and info",
    "landing.tagline": "Learn the words you actually need. Build your own collections and study them with flashcards, quizzes and spaced repetition, on any device.",
    "landing.turn": "Tap to turn",
    "landing.modes.title": "Two ways to study",
    "landing.flash.text": "See the word and tap the card to turn it. Swipe right if you know it, left if you don't.",
    "landing.quiz.text": "Pick the right translation from up to four options. Get it right the first time and the word moves up.",
    "landing.srs.title": "Words come back when it counts",
    "landing.srs.text": "Spaced repetition decides what to study today. Each time you know a word, it waits longer before coming back. Miss it, and it returns a few cards later.",
    "landing.srs.caption": "Days until the next review",
    "landing.collections.title": "Your words, your collections",
    "landing.own.title": "Build your own",
    "landing.own.text": "Add words one at a time or import a CSV file, then switch collections on and off to choose what you study.",
    "landing.starter.title": "Or start right away",
    "landing.starter.text": "Eight ready-made Spanish collections, levels A1 and A2, with 100 words each.",
    "landing.sync.title": "On every device",
    "landing.sync.text": "Sign in with Google and your words and progress follow you. Add it to your home screen and it opens like an app.",
    "landing.lang.title": "Any language, read aloud",
    "landing.interface.title": "Learn in any language",
    "landing.interface.text": "Your words can be in any language. The app itself comes in English, Russian and Spanish.",
    "landing.voice.title": "Hear every word",
    "landing.voice.text": "Tap the speaker on a card to hear it, in English, Spanish, Russian, French or German, with your device's own voices.",
    "landing.share.title": "Share your collections",
    "landing.share.text": "Made a word list others could use? Send it in as a CSV file and it can become a starter collection for everyone. The code is public on GitHub.",
    "landing.share.submit": "Submit a collection",
    "landing.share.repo": "See it on GitHub",
    "landing.cta.title": "Ready to start?",
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
    "words.wordSaved": "Saved “{word}”",
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
    "collections.importHint": "A CSV file with the columns word,translation becomes a new collection. Language codes as column names, like es,en, also set its languages. Anki's plain text export works too.",
    "collections.importFile": "Choose a file",
    "collections.library": "Starter collections",
    "collections.wordCount": "{count} words",
    "collections.imported": "Imported “{name}”: {count} words",
    "collections.importing": "Importing “{name}” ({count} words)…",
    "collections.importFailed": "Could not import: {error}",
    "collections.importEmpty": "No words found in that file",
    "collections.wordLanguage": "Word language",
    "collections.swapDirection": "Cards show {first} first. Swap sides",
    "collections.translationLanguage": "Translation language",
    "collections.noVoice": "This device has no voice for {languages}, so the speaker button won't show here.",
    "collections.tooBig": "the words are too long to store in one collection (about 1 MB at most); split them into smaller collections",
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
    "card.next": "Далее",
    "card.speak": "Прочитать вслух",
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
    "account.title": "Аккаунт",
    "account.deleteHint": "Удаляет ваши коллекции, прогресс и вход в приложение. Это нельзя отменить, поэтому сначала экспортируйте коллекции, которые хотите сохранить.",
    "account.delete": "Удалить аккаунт",
    "account.deleteConfirm": "Нажмите ещё раз, чтобы удалить всё",
    "account.deleting": "Удаляем аккаунт…",
    "account.deleteFailed": "Не удалось удалить аккаунт: {error}",
    "account.signInAgain": "выйдите, войдите снова и удалите его в течение нескольких минут",
    "account.deleted": "Ваш аккаунт и все ваши слова удалены.",
    "footer.expand": "Показать настройки и сведения",
    "footer.collapse": "Скрыть настройки и сведения",
    "landing.tagline": "Учите те слова, которые вам действительно нужны. Создавайте свои коллекции и занимайтесь с карточками, тестами и интервальным повторением на любом устройстве.",
    "landing.turn": "Нажмите, чтобы перевернуть",
    "landing.modes.title": "Два способа заниматься",
    "landing.flash.text": "Посмотрите на слово и нажмите на карточку, чтобы перевернуть её. Смахните вправо, если знаете слово, и влево, если нет.",
    "landing.quiz.text": "Выберите правильный перевод среди вариантов (их до четырёх). Ответите верно с первого раза, и слово перейдёт на следующий уровень.",
    "landing.srs.title": "Слова возвращаются вовремя",
    "landing.srs.text": "Интервальное повторение решает, что учить сегодня. Каждый раз, когда вы знаете слово, оно возвращается всё позже. Ошиблись, и оно вернётся через несколько карточек.",
    "landing.srs.caption": "Дней до следующего повторения",
    "landing.collections.title": "Ваши слова, ваши коллекции",
    "landing.own.title": "Создайте свою",
    "landing.own.text": "Добавляйте слова по одному или импортируйте CSV-файл, а потом включайте и выключайте коллекции, чтобы выбрать, что учить.",
    "landing.starter.title": "Или начните сразу",
    "landing.starter.text": "Восемь готовых испанских коллекций, уровни A1 и A2, по 100 слов в каждой.",
    "landing.sync.title": "На любом устройстве",
    "landing.sync.text": "Войдите через Google, и ваши слова и прогресс будут с вами везде. Добавьте на главный экран, и приложение откроется как обычное.",
    "landing.lang.title": "Любой язык, вслух",
    "landing.interface.title": "Учите любой язык",
    "landing.interface.text": "Слова могут быть на любом языке. Само приложение работает на английском, русском и испанском.",
    "landing.voice.title": "Слушайте слова",
    "landing.voice.text": "Нажмите на значок динамика на карточке, чтобы услышать слово: на английском, испанском, русском, французском или немецком, голосами вашего устройства.",
    "landing.share.title": "Делитесь коллекциями",
    "landing.share.text": "Составили список слов, который пригодится другим? Пришлите его CSV-файлом, и он может стать готовой коллекцией для всех. Код доступен на GitHub.",
    "landing.share.submit": "Отправить коллекцию",
    "landing.share.repo": "Посмотреть на GitHub",
    "landing.cta.title": "Готовы начать?",
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
    "words.wordSaved": "Слово «{word}» сохранено",
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
    "collections.importHint": "CSV-файл со столбцами word,translation станет новой коллекцией. Коды языков вместо названий столбцов, например es,en, сразу зададут её языки. Подойдёт и экспорт Anki в виде простого текста.",
    "collections.importFile": "Выбрать файл",
    "collections.library": "Готовые коллекции",
    "collections.wordCount": "Слов: {count}",
    "collections.imported": "Импортировано «{name}», слов: {count}",
    "collections.importing": "Импортируем «{name}» (слов: {count})…",
    "collections.importFailed": "Не удалось импортировать: {error}",
    "collections.importEmpty": "В файле не найдено слов",
    "collections.wordLanguage": "Язык слов",
    "collections.swapDirection": "Сначала на карточке: {first}. Поменять стороны",
    "collections.translationLanguage": "Язык переводов",
    "collections.noVoice": "На этом устройстве нет голоса для: {languages}, поэтому кнопка озвучивания здесь не появится.",
    "collections.tooBig": "слова слишком длинные, чтобы хранить их в одной коллекции (не больше ~1 МБ); разделите их на несколько коллекций",
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
    "card.next": "Siguiente",
    "card.speak": "Leer en voz alta",
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
    "account.title": "Cuenta",
    "account.deleteHint": "Elimina tus colecciones, tu progreso y tu inicio de sesión. No se puede deshacer, así que exporta antes las colecciones que quieras conservar.",
    "account.delete": "Eliminar mi cuenta",
    "account.deleteConfirm": "Toca otra vez para eliminarlo todo",
    "account.deleting": "Eliminando tu cuenta…",
    "account.deleteFailed": "No se pudo eliminar tu cuenta: {error}",
    "account.signInAgain": "cierra sesión, vuelve a entrar y elimínala en unos minutos",
    "account.deleted": "Tu cuenta y todas tus palabras se han eliminado.",
    "footer.expand": "Mostrar ajustes e información",
    "footer.collapse": "Ocultar ajustes e información",
    "landing.tagline": "Aprende las palabras que de verdad necesitas. Crea tus propias colecciones y estúdialas con tarjetas, tests y repetición espaciada, en cualquier dispositivo.",
    "landing.turn": "Toca para girar",
    "landing.modes.title": "Dos formas de estudiar",
    "landing.flash.text": "Mira la palabra y toca la tarjeta para girarla. Desliza a la derecha si la sabes y a la izquierda si no.",
    "landing.quiz.text": "Elige la traducción correcta entre hasta cuatro opciones. Si aciertas a la primera, la palabra sube de nivel.",
    "landing.srs.title": "Las palabras vuelven cuando importa",
    "landing.srs.text": "La repetición espaciada decide qué estudiar hoy. Cada vez que sabes una palabra, tarda más en volver. Si fallas, regresa unas tarjetas después.",
    "landing.srs.caption": "Días hasta el próximo repaso",
    "landing.collections.title": "Tus palabras, tus colecciones",
    "landing.own.title": "Crea la tuya",
    "landing.own.text": "Añade palabras una a una o importa un archivo CSV, y activa o desactiva colecciones para elegir qué estudiar.",
    "landing.starter.title": "O empieza ya",
    "landing.starter.text": "Ocho colecciones de español listas para usar, niveles A1 y A2, con 100 palabras cada una.",
    "landing.sync.title": "En todos tus dispositivos",
    "landing.sync.text": "Entra con Google y tus palabras y tu progreso te acompañan. Añádela a tu pantalla de inicio y se abre como una app.",
    "landing.lang.title": "Cualquier idioma, en voz alta",
    "landing.interface.title": "Aprende cualquier idioma",
    "landing.interface.text": "Tus palabras pueden estar en cualquier idioma. La app está en inglés, ruso y español.",
    "landing.voice.title": "Escucha cada palabra",
    "landing.voice.text": "Toca el altavoz de una tarjeta para oírla, en inglés, español, ruso, francés o alemán, con las voces de tu dispositivo.",
    "landing.share.title": "Comparte tus colecciones",
    "landing.share.text": "¿Has hecho una lista de palabras útil para otros? Envíala como archivo CSV y puede convertirse en una colección para todos. El código es público en GitHub.",
    "landing.share.submit": "Enviar una colección",
    "landing.share.repo": "Verlo en GitHub",
    "landing.cta.title": "¿Listo para empezar?",
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
    "words.wordSaved": "Se guardó «{word}»",
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
    "collections.importHint": "Un archivo CSV con las columnas word,translation se convierte en una colección nueva. Los códigos de idioma como nombres de columna, por ejemplo es,en, también fijan sus idiomas. También sirve la exportación de Anki en texto plano.",
    "collections.importFile": "Elegir un archivo",
    "collections.library": "Colecciones iniciales",
    "collections.wordCount": "{count} palabras",
    "collections.imported": "Importada «{name}»: {count} palabras",
    "collections.importing": "Importando «{name}» ({count} palabras)…",
    "collections.importFailed": "No se pudo importar: {error}",
    "collections.importEmpty": "No se encontraron palabras en el archivo",
    "collections.wordLanguage": "Idioma de las palabras",
    "collections.swapDirection": "Primero en la tarjeta: {first}. Cambiar de lado",
    "collections.translationLanguage": "Idioma de las traducciones",
    "collections.noVoice": "Este dispositivo no tiene voz para: {languages}, así que aquí no aparecerá el botón de audio.",
    "collections.tooBig": "las palabras son demasiado largas para guardarlas en una colección (como mucho ~1 MB); divídelas en colecciones más pequeñas",
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

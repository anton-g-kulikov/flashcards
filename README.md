# Flashcards

A personal flashcards PWA for learning vocabulary on your phone. Sign in with Google, organise
words into collections, and learn them with flashcards and quizzes. Your collections and progress
sync across devices and keep working offline.

**Try it here:** https://flashcards-ak-app.web.app

## Using it

- **Study** (`index.html`): studies every word in the collections that are switched on. Quiz mode
  asks what a word means and offers up to four translations; Flashcard mode shows the word and
  flips to the translation. Correct answers and "I know this" mark a word known; Reset Progress
  starts these words over. Only words with a translation appear in quizzes.
- **My Words** (`vocabulary-manager.html`): one collapsible card per collection. Its header
  switches it on or off for study and has rename, export and delete; open it to add words one at
  a time (the translation is optional and can be added later) and edit or delete them. **New**
  and **Import** at the top create collections.
- **Interface language**: English, Russian or Spanish, from the header or the sign-in screen.

## Collections and CSV

A collection is a list of words with their translations. Collections move in and out of the app
as CSV files:

```csv
word,translation
la casa,house
comer,to eat
hacer,"to do, to make"
```

- UTF-8, first line `word,translation`, one word per line.
- Quote a field that contains a comma or a double quote (`"to do, to make"`), and double any
  quote inside it.
- The translation may be empty. Other columns are ignored, and repeated words are skipped.
- Any language pair works: the app shows `word` first and quizzes you on `translation`.

### Export a collection from the app

1. Open **My Words** (the **+** next to the title).
2. Tap the download icon in the collection's header. You get `<collection name>.csv`; on an
   iPhone, save it to Files or share it.

### Import someone else's collection

1. Get the CSV file: from a friend, or from [`public/collections/`](public/collections/) in this
   repository (open the file on GitHub, then **Download raw file**).
2. In **My Words**, tap **Import → Choose a CSV file**. It becomes a new collection named after
   the file, switched on for study. Nothing you already have is changed.

The collections in this repository are also listed under **Import → Starter collections**, so
you can add them in one tap, without downloading anything.

### Starter collections

Spanish → English, 100 words each, in [`public/collections/es-en/`](public/collections/es-en/):

| Level | Nouns | Verbs | Adjectives | Adverbs |
| --- | --- | --- | --- | --- |
| A1 | [a1-nouns.csv](public/collections/es-en/a1-nouns.csv) | [a1-verbs.csv](public/collections/es-en/a1-verbs.csv) | [a1-adjectives.csv](public/collections/es-en/a1-adjectives.csv) | [a1-adverbs.csv](public/collections/es-en/a1-adverbs.csv) |
| A2 | [a2-nouns.csv](public/collections/es-en/a2-nouns.csv) | [a2-verbs.csv](public/collections/es-en/a2-verbs.csv) | [a2-adjectives.csv](public/collections/es-en/a2-adjectives.csv) | [a2-adverbs.csv](public/collections/es-en/a2-adverbs.csv) |

Nouns carry their article (`la casa`), verbs are infinitives (`comer` → `to eat`) and adjectives
are masculine singular. No Spanish word appears in more than one of these eight collections.

## Contributing a collection

Have a word list others could use? Send it in, and it can become a starter collection in the app.

**First, make a CSV file** in the [format above](#collections-and-csv). The easiest way: build the
collection in the app, then export it with the download icon in its header. Give every word a
translation, and check the spelling (and, for nouns, the articles).

**Then send it**, whichever way suits you:

- **Open an issue (easiest).** Use the
  [New collection form](https://github.com/anton-g-kulikov/flashcards/issues/new?template=new-collection.yml):
  say which languages it covers and the level or topic, attach the CSV, and say where the words
  come from. All you need is a GitHub account.
- **Or open a pull request.** Fork this repository, add your file to
  [`public/collections/`](public/collections/) (on github.com: **Add file → Upload files**), and
  open a pull request with the same details in the description.

Only share lists you made yourself or are allowed to share. I'll review the words, put the file in
place and add it to the app's list.

## How it works

| Piece | Where |
| --- | --- |
| Static app, no build step | `public/` (served as-is by Firebase Hosting) |
| Firebase access (Google sign-in, Firestore) | `public/src/core/cloud.js`, an ES module loaded from Google's CDN |
| Sign-in screen, account chip, loading errors | `public/src/ui/auth-gate.js` |
| Interface texts in English, Russian and Spanish | `public/src/ui/i18n.js`: `data-i18n*` attributes in the HTML, `I18n.t()` in scripts |
| Study app (modes, stats, progress) | `public/src/core/core.js`, `public/src/features/flashcards/`, `public/src/utils/script.js` |
| Collections and words | `public/src/features/vocabulary-manager/word-manager.js` |
| CSV reading and writing | `public/src/utils/csv.js`, tested in `test/csv.test.js` |
| Starter collections | `public/collections/` with `index.json` |
| App icon | `public/icons/icon-base.svg`; the PNGs in `icons/ios` and `icons/android` are rendered from it. Icon URLs carry `?v=N`: bump it everywhere (both pages, `manifest.json`, `sw.js`) when the icon changes, or phones keep the cached one |
| Security rules | `firestore.rules`, tested in `test/firestore.rules.test.js` |
| Analytics | GA4 property `flashcards-ak-app` (measurement ID `G-E0J0MDFKE6`), tag in the `<head>` of both pages; skipped on localhost. Events go through `public/src/utils/analytics.js` |

Data lives under each user's uid; the rules allow nobody else in:

```text
users/{uid}/collections/{id}  { name, active, createdAt, updatedAt }
users/{uid}/cards/{cardId}    { word, translation, collectionId, createdAt, updatedAt }
users/{uid}/meta/progress     { known: [cardId], history: { cardId: lastSeenMs }, updatedAt }
```

Cards saved before collections existed have no `collectionId` and belong to the `default`
collection.

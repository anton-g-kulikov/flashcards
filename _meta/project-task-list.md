# Project Task List

Temporal tracking for Flashcards. Evergreen behavior lives in `../README.md`; test intent lives in
`../test/test-documentation.md`.

## Done

### TASK-001 — Personal flashcards from dgt-vocab (2026-10-31)

- **Goal:** Turn the shared DGT vocabulary app into personal collections behind Google sign-in.
- **Success criteria:**
  - Signing in with Google is required; each account sees only its own words and progress.
  - Quiz and flashcard modes, stats, known/unknown tracking and Reset Progress behave as before.
  - Words are added one at a time: a word plus an optional Russian translation.
  - A translation can be added or changed later, and a word can be deleted.
  - Firestore rules refuse access to other users' data and malformed cards.
- **Scope changes during the task:** the dgt-vocab admin tooling (text parser, auto-translation,
  topics, categories, examples, English translations, CSV/JS export, GitHub pull requests) was
  removed on request in favour of one-word-at-a-time entry. Topic/category filters and the
  English/Russian toggle went from the study page with it.
- **Verification:** rules tests (9 passing); manual end-to-end check on the emulators — sign-in,
  add/duplicate/edit/delete, quiz and flashcards, progress surviving reload, a second account
  seeing an empty collection.

### TASK-002 — Collections, CSV and starter decks (2026-10-31)

- **Goal:** Organise words into collections that can be shared as CSV files.
- **Success criteria:**
  - Words belong to collections; existing words land in a default "My words" collection.
  - Collections are managed in My Words: create, rename, delete (with their words), switch
    on/off for study. The study page uses every switched-on collection.
  - Export a collection to `word,translation` CSV; import a CSV as a new collection.
  - Eight Spanish→English starter collections (A1/A2 × nouns, verbs, adjectives, adverbs,
    100 words each) in `public/collections/`, importable from the app.
  - README explains exporting, importing and contributing collections.
- **Also fixed:** the study page could hang on "Loading quiz…": the Firestore cache moved to
  single-tab mode, and loading now shows an error with a retry after 15 s instead of hanging.
- **Verification:** 14 rules tests and 9 CSV/collection tests; manual check on the emulators at
  375px (library import, file import, toggles driving the study page, new/rename/delete).

## Backlog

- Google Analytics: needs a GA4 property for `flashcards-ak-app` (Firebase console →
  Integrations) before a tag can be added; dgt-vocab's property was removed on purpose.

- Decide on a custom domain and add it to Firebase Auth's authorized domains.
- Card-level spaced repetition (the study modes still use known/unknown plus last-seen ordering).
- Account deletion (delete the user's cards and progress, then the Auth user).

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

## Planned

### TASK-003 — Spaced repetition (proposed 2026-10-31, awaiting approval)

- **Goal:** Words come back for review at growing intervals instead of leaving the rotation
  for good once known. Each session shows what is due first.
- **Approach: Leitner boxes.** Simple to explain and to reason about; no tuning parameters.
  - Every word sits in a box 0–5 with a due date. Box 0 = new.
  - Correct (quiz right on the first try, or "I know this!") moves it up one box and schedules it:
    box 1 → 1 day, 2 → 3 days, 3 → 7 days, 4 → 16 days, 5 → 35 days.
  - Wrong (any wrong quiz answer, or "I don't know") drops it to box 1, due again in the same
    session.
  - "Mastered" = box 5. It still comes back every 35 days.
- **What you study:** due words first, oldest due first, then new words. When nothing is due, the
  card says "All caught up" with the time of the next review.
- **Quiz answer options** come from all words in the switched-on collections, not only unknown
  ones, so the quiz works even when just one word is due.
- **Stats row:** Due · Learning · Mastered (replaces Cards · Known · Unknown).
- **Data:** the progress document gets `srs: { cardId: { box, due } }`; `known`/`history` are
  migrated on first load (known words → box 2, due today, so they get one review) and then
  dropped. About 40 bytes per word, well within the document limit for tens of thousands of words.
  Rules updated in the same change.
- **Reset Progress** returns the studied words to box 0.
- **Tests first:** the scheduling (box moves, due dates, what is due, the migration) as pure
  functions in `public/src/core/srs.js` with Node tests; rules tests for the new field; manual
  check on the emulators at phone width.
- **Docs:** README "How studying works" rewritten for the new rules.
- **Out of scope for now:** daily limits on new words, per-word ease (SM-2/FSRS), review
  reminders or notifications.
- **Open decisions:** the interval ladder above; whether to cap new words per day.

## Backlog

- Decide on a custom domain and add it to Firebase Auth's authorized domains.
- Account deletion (delete the user's cards and progress, then the Auth user).

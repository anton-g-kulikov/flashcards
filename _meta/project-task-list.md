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

### TASK-003 — Spaced repetition (done 2026-11-01)

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
- **Decided:** the interval ladder above; no daily cap on new words for now.
- **As built:** progress lives in `public/src/features/study/progress.js` (not `core/srs.js`). The stats bar shows the average box. Words seen before spaced repetition but never marked known start as new. The quiz no longer hands the last word over to Flashcards.

### TASK-004 — Audit fixes (2026-11-01)

- **Goal:** resolve every finding of the 31 October review; results per finding in
  [`audit-2026-10-31.md`](audit-2026-10-31.md).
- **Done:** ES modules without inline code and an enforced CSP; dead dgt-vocab code removed;
  keyboard access; pure, tested study logic; one document per collection (atomic imports); progress
  saved as merged changes; server-clock timestamps; a versioned cache-first service worker with a
  pre-deploy version check; fonts and SDK preloaded; import reports; old data migrated and the
  migration code removed.
- **Decided:** analytics stays opt-out (cookie note with "Turn off analytics").
- **Lesson:** rules must accept what the previous app version does, since installed apps run it
  for one more session after a deploy (1.13.0 broke the first open; fixed in 1.13.1).

### TASK-005 — Appearance and study polish (2026-11-01)

- Light / dark / match-the-device switch (as in NoChords and What's Next), applied before first
  paint.
- A missed word comes back after three other words, in both Flash Mode and Quiz Mode.
- "Flashcards" renamed to Flash Mode; more room around the mode switcher.
- Dark iOS launch screen: light and dark launch images per screen size. The home-screen
  shortcuts (`?mode=flashcard`, `?mode=quiz`) now open the mode they name.

### TASK-006 — Account deletion (2026-11-01)

- **Goal:** let people delete their account themselves, as the privacy page promises.
- **Done:** an Account section at the foot of My Cards. "Delete my account", after a second tap,
  deletes every collection and the progress record in one batch, then the Firebase Auth user. A
  sign-in older than a few minutes is confirmed in Google's popup first, before anything is deleted.
  The sign-in screen then says the account is gone.
- **Verification:** rules tests for the batch delete (owner only); end to end on the emulators,
  where no collection, progress record or Auth user was left.

## Backlog

- Spaced repetition: a daily limit on new words (an import of 100 makes all 100 due at once).
- Spaced repetition: per-word difficulty (SM-2 or FSRS) instead of fixed boxes.
- Review reminders or notifications.
- Android launch screen in dark mode: Chrome takes one `background_color` from the manifest, so
  it stays light until browsers support a dark variant.

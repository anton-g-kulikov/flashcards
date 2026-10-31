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

## Backlog

- Decide on a custom domain and add it to Firebase Auth's authorized domains.
- Card-level spaced repetition (the study modes still use known/unknown plus last-seen ordering).
- Account deletion (delete the user's cards and progress, then the Auth user).

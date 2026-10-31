# Test Documentation

## Automated: Firestore security rules (`firestore.rules.test.js`)

Run with `npm test` (Firestore emulator, Node's built-in test runner).

| Case | Expectation |
| --- | --- |
| Owner creates, reads, updates, deletes own card | allowed |
| Card with only a `word` | allowed |
| Another user reads, writes or deletes someone's card | denied |
| Signed-out visitor reads or writes a card | denied |
| Card with an unknown field, no word, empty or >200-char word, non-string translation | denied |
| Owner saves and reads own progress | allowed |
| Another user reads or writes someone's progress | denied |
| Progress with an unexpected field | denied |
| User document, or any other `meta/*` document | denied |

## Manual: end-to-end on the emulators

With `npm run dev`, at http://127.0.0.1:5050:

1. Signed out, both pages show only the sign-in screen.
2. Sign in (emulator popup or `Cloud.signInForTesting()`): the account chip shows the name.
3. My Words: add a word with and without a translation; adding the same word again (any case)
   is refused; editing a translation and deleting a word persist after reload.
4. Study: quiz options are the collection's translations; untranslated words are left out of the
   quiz; flashcards flip to the translation ("No translation yet" when missing).
5. Answer a quiz question correctly, reload: the known count is kept.
6. Sign out and in as a different account: the collection is empty.

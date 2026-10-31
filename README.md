# Flashcards

A personal flashcards PWA. Sign in with Google, add your own words one at a time (with an
optional Russian translation), and learn them with flashcards and quizzes. Each account has its
own collection and progress, synced across devices and available offline.

Forked from [dgt-vocab](https://github.com/anton-g-kulikov/dgt-vocab): the study modes and
their mechanics are the same; the shared DGT vocabulary became a per-user collection.

## Using it

- **Study** (`index.html`): Quiz mode picks a word and offers up to four translations; Flashcard
  mode shows the word and flips to the translation. "I know this" / correct answers mark a word
  known; Reset Progress starts over. Only words with a translation appear in quizzes.
- **My Words** (`vocabulary-manager.html`): add a word and, optionally, its translation. The list
  below lets you add or fix a translation later, or delete a word.

## How it works

| Piece | Where |
| --- | --- |
| Static app, no build step | `public/` (served as-is by Firebase Hosting) |
| Firebase access (Google sign-in, Firestore) | `public/src/core/cloud.js` — ES module loaded from Google's CDN |
| Sign-in screen and account chip | `public/src/ui/auth-gate.js` |
| Study app (modes, stats, progress) | `public/src/core/core.js`, `public/src/features/flashcards/` |
| Adding and editing words | `public/src/features/vocabulary-manager/word-manager.js` |
| Security rules | `firestore.rules`, tested in `test/firestore.rules.test.js` |

Data lives under each user's uid; the rules allow nobody else in:

```text
users/{uid}/cards/{cardId}   { word, translation?, createdAt, updatedAt }
users/{uid}/meta/progress    { known: [cardId], history: { cardId: lastSeenMs }, updatedAt }
```

## Development

Requires Node 22+, Java (for the emulators) and the Firebase CLI.

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` starts the Auth, Firestore and Hosting emulators; open http://127.0.0.1:5050. On
localhost the app talks to the emulators, so nothing touches production. The emulator's sign-in
popup lets you create test Google accounts; for scripted checks, `window.Cloud.signInForTesting()`
signs in without the popup (emulators only).

```bash
npm test
```

Runs the Firestore rules tests against a throwaway emulator. (If `npm run dev` is already using
port 8080, run `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test test/*.test.js` instead.)

## Deploying

Firebase project: `flashcards-ak-app` (Firestore in `eur3`).

```bash
npm run deploy
```

Deploys Hosting and the Firestore rules. When you change any file in `public/`, bump
`CACHE_NAME` in `public/sw.js` so installed copies pick up the update.

One-time console step: **Google sign-in must be enabled** under Authentication → Sign-in method
in the [Firebase console](https://console.firebase.google.com/project/flashcards-ak-app/authentication/providers).
It can't be turned on from the CLI.

# System Documentation

Maintainer notes for running, testing and deploying Flashcards. What the app does and how it is
structured is in [`../README.md`](../README.md); test intent is in
[`../test/test-documentation.md`](../test/test-documentation.md).

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

Runs the Firestore rules tests against a throwaway emulator, plus the CSV and starter-collection
checks. (If `npm run dev` is already using port 8080, run
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test test/*.test.js` instead.)

## Deploying

Firebase project: `flashcards-ak-app` (Firestore in `eur3`).

```bash
npm run deploy
```

Deploys Hosting and the Firestore rules. When you change any file in `public/`, bump
`CACHE_NAME` in `public/sw.js` so installed copies pick up the update.

Google sign-in is enabled under Authentication → Sign-in method in the
[Firebase console](https://console.firebase.google.com/project/flashcards-ak-app/authentication/providers)
(a console-only setting, needed again for any new project). A custom domain also has to be added
to Authentication → Settings → Authorized domains.

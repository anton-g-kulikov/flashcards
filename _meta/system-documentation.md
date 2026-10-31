# System Documentation

How Flashcards is built, run, tested and deployed. What the app does for its users, the CSV
format and the contribution guide are in [`../README.md`](../README.md); test intent is in
[`../test/test-documentation.md`](../test/test-documentation.md).

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

Firebase project: `flashcards-ak-app` (Firestore in `eur3`). Live at https://yourflashcards.app
(also https://flashcards-ak-app.web.app). The domain's DNS is on Cloudflare: an A record to
`199.36.158.100` plus the Firebase TXT records, all "DNS only" (Cloudflare's proxy breaks
Firebase's certificate). The API token for Cloudflare lives in the git-ignored `.env`.
Cloudflare Email Routing forwards `help@yourflashcards.app` (the contact on the privacy page) to
the maintainer's Gmail; other addresses at the domain bounce (the catch-all rule is off).

```bash
npm run deploy
```

Deploys Hosting and the Firestore rules. When you change any file in `public/`, bump
`CACHE_NAME` in `public/sw.js` so installed copies pick up the update.

Google sign-in is enabled under Authentication → Sign-in method in the
[Firebase console](https://console.firebase.google.com/project/flashcards-ak-app/authentication/providers)
(a console-only setting, needed again for any new project). A custom domain also has to be added
to Authentication → Settings → Authorized domains.

# System Documentation

How Flashcards is built, run, tested and deployed. What the app does for its users, the CSV
format and the contribution guide are in [`../README.md`](../README.md); test intent is in
[`../test/test-documentation.md`](../test/test-documentation.md).

## How it works

| Piece | Where |
| --- | --- |
| Static app, no build step | `public/` (served as-is by Firebase Hosting). Every script is an ES module; each page loads one entry module (`src/study.js`, `src/my-cards.js`) and has no inline scripts or `on*` attributes |
| Shared page set-up (service worker, analytics, footer version; fonts and the Firebase SDK are preloaded from each page's `<head>`) | `public/src/core/page.js`; the version is `public/src/core/version.js` and must match `CACHE_NAME` in `sw.js` (tested in `test/app-shell.test.js`, which also checks that `sw.js` precaches every file) |
| Firebase access (Google sign-in, Firestore) | `public/src/core/cloud.js`, importing the Firebase SDK from Google's CDN |
| Sign-in screen, account chip, loading errors | `public/src/ui/auth-gate.js` |
| Light and dark appearance (as in NoChords and What's Next) | `public/src/ui/theme.js` decides, `theme-switch.js` renders the three-icon switch into `[data-theme-switch]` (foot of Study and My Cards), `theme-init.js` is a classic script in each page's `<head>` that applies a saved choice before first paint (the CSP allows no inline script). "Match the device" sets nothing and the stylesheet's `prefers-color-scheme` rule follows the device live; light and dark set `data-theme` on `<html>`. Saved per device (`flashcards-theme` in `localStorage`). Dark colours are the second token set at the top of `styles.css`; tested in `test/theme.test.js` |
| Interface texts in English, Russian and Spanish | `public/src/ui/i18n.js`: `data-i18n*` attributes in the HTML, `I18n.t()` in scripts |
| Study page (modes, stats, saving progress) | `public/src/study.js`, the modes in `public/src/features/flashcards/` |
| Study logic without the DOM (spaced repetition, quiz choices, random order) | `public/src/features/study/progress.js`, `quiz-logic.js`, `public/src/utils/shuffle-utils.js`, tested in `test/study.test.js` and `test/shuffle.test.js` |
| Collections and words | `public/src/features/vocabulary-manager/word-manager.js` (page), `public/src/core/cloud.js` and `card-data.js` (storage) |
| CSV reading and writing | `public/src/utils/csv.js`, tested in `test/csv.test.js` |
| Starter collections | `public/collections/` with `index.json` |
| App icon | `public/icons/icon-base.svg`; the PNGs in `icons/ios` and `icons/android` are rendered from it. Icon URLs carry `?v=N`: bump it everywhere (both pages, `manifest.json`, `sw.js`) when the icon changes, or phones keep the cached one |
| Security rules | `firestore.rules`, tested in `test/firestore.rules.test.js` |
| Security headers | `firebase.json`: an enforced Content-Security-Policy on the pages (scripts only from the app, Google's CDN for Firebase, `apis.google.com` for sign-in and Google Tag Manager; no inline scripts, handlers or style attributes; the emulator ports are allowed for local development), plus `nosniff`, `X-Frame-Options: SAMEORIGIN` (Firebase Auth's frame is same-origin on yourflashcards.app), Referrer-Policy and Permissions-Policy. `test/app-shell.test.js` checks the pages stay inline-free. The emulators read headers at start-up, so restart `npm run dev` after changing them |
| Analytics | GA4 property `flashcards-ak-app` (measurement ID `G-E0J0MDFKE6`), loaded and sent by `public/src/utils/analytics.js`; skipped on localhost. The cookie note at the foot of Study and My Cards (`public/src/ui/analytics-note.js`) lets people opt out per device (`flashcards-analytics` = `off` in `localStorage`): Analytics then never loads there, and turning it off mid-visit also sets `ga-disable-<id>` and deletes the `_ga` cookies. Events: `study_start`, `mode_switch`, `study_time`, `quiz_answer`, `card_marked`, `language_switch`, `progress_reset`, `pwa_*` |

Data lives under each user's uid; the rules allow nobody else in:

```text
users/{uid}/collections/{id}  { name, active, cards: [{ id, word, translation }], createdAt, updatedAt }
users/{uid}/meta/progress     { srs: { cardId: { box, due } }, updatedAt }
```

Progress is spaced repetition with Leitner boxes (`public/src/features/study/progress.js`, tested
in `test/study.test.js`): box 0 is new, boxes 1–5 come back after 1, 3, 7, 16 and 35 days, a
miss goes back to box 1 due now; `due` is in ms. It is saved as changes, not as a whole:
`Progress` records each changed entry, and `Cloud.saveProgressChanges` merges them in (`set` with
`merge`, `deleteField()` to forget one), at most every 2 seconds and when the page is hidden. Two
devices studying at once both keep their progress. Progress of deleted cards is pruned when the
study page loads. Progress saved before spaced repetition (`known: [cardId]`, `history`) is
converted on load (known words to box 2, due now) and the old fields are deleted. The rules
refuse a write that would drop `srs` (an old version's whole-record save) and any `updatedAt`
other than the server's clock.

A collection's cards live in its own document, at most 5,000 of them (well under Firestore's
1 MiB per document), so loading everything costs one read per collection, an import is a single
atomic write, and word edits are transactions on that document (`public/src/core/cloud.js`).
Firestore rules can't check list items, so `public/src/core/card-data.js` trims every card to
its fields and lengths.

Until 1.9.0 each card was a document of its own in `users/{uid}/cards`. On load, `Cloud.loadAll`
moves any it still finds into their collection (keeping their ids, so progress still applies;
cards whose collection is gone go to the default one) and deletes them; the rules still let the
owner read and delete them for that, but not create any. The move is planned by
`planMigration` in `card-data.js` and tested in `test/card-data.test.js`.

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
signs in without the popup (`window.Cloud` exists only on the emulators).

```bash
npm test
```

Runs the Firestore rules tests against a throwaway emulator, plus the CSV, starter-collection,
study-logic, shuffle, app-shell and XSS checks. (If `npm run dev` is already using port 8080, run
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

Deploys Hosting and the Firestore rules. The service worker serves the app's files from its
cache (no network round trip; network first on localhost, so local edits show at once) and only
fetches new ones when `CACHE_NAME` changes. So every deploy that changes an app file must raise
`VERSION` in `public/src/core/version.js` and `CACHE_NAME` in `public/sw.js` together.
`scripts/check-version.js` runs before each hosting deploy and stops it if files differ from the
live ones under the same version. Installed apps pick a new version up the next time they open
(the current session finishes on the version it started with, so a page never mixes files from
two deploys).

The in-app browser of the Claude desktop app can't fetch service-worker scripts from the local
emulator (127.0.0.1); to try service-worker changes, deploy a preview channel:
`firebase hosting:channel:deploy <name> --expires 1d`.

Google sign-in is enabled under Authentication → Sign-in method in the
[Firebase console](https://console.firebase.google.com/project/flashcards-ak-app/authentication/providers)
(a console-only setting, needed again for any new project). A custom domain also has to be added
to Authentication → Settings → Authorized domains.

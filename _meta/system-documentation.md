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
| Landing page | The signed-out view of `public/index.html` (`.auth-gate.landing`), with sign-in at both ends. Its feature cards reuse the flashcard styles and turn over through `public/src/ui/landing.js`. The text is in the HTML for search engines and translated through `i18n.js`; keep it true to the app when features change. My Cards keeps the plain sign-in card |
| Light and dark appearance (as in NoChords and What's Next) | `public/src/ui/theme.js` decides, `theme-switch.js` renders the three-icon switch into `[data-theme-switch]` (the footer of Study and My Cards), `theme-init.js` is a classic script in each page's `<head>` that applies a saved choice before first paint (the CSP allows no inline script). "Match the device" sets nothing and the stylesheet's `prefers-color-scheme` rule follows the device live; light and dark set `data-theme` on `<html>`. Saved per device (`flashcards-theme` in `localStorage`). Dark colours are the second token set at the top of `styles.css`; tested in `test/theme.test.js` |
| Account deletion | `public/src/features/vocabulary-manager/delete-account.js` (the Account section of My Cards) calls `Cloud.deleteAccount`: confirms a sign-in older than 4 minutes in Google's popup, deletes every collection and the progress record in one batch, then the Auth user. The sign-in screen says so afterwards (a `sessionStorage` flag read by `auth-gate.js`) |
| Footer | `public/src/ui/footer.js`, on Study and My Cards: folds away behind a tab on its divider, as in What's Next. It only shows when signed in, starts collapsed on every load (the HTML has `data-collapsed` and `inert`, so nothing flashes), and opening it isn't remembered |
| Reading words aloud | `public/src/features/study/speech.js`, tested in `test/speech.test.js`: the Web Speech API, so no server or cost; voices are the device's, preferring on-device ones over online ones. A collection's optional `language` is a pair like `es-en` (either side may be empty; `languagePair` in `card-data.js`), set in My Cards or carried over from `collections/index.json` on a starter import. A speaker button shows only when that side has a language, the text is 10 words or fewer, and the device has a voice; voices can arrive after the page draws, so `voiceschanged` updates the buttons. The first word after a page load follows a silent utterance, because the sleeping audio output otherwise swallows its start |
| Language order | A collection's optional `reversed` flag, set by the arrow between its two languages in My Cards. `studyCard` in `card-data.js` swaps the two sides and their languages as the study page loads, so Flash Mode, the quiz and speech need no change of their own, and stored words stay as they are. Progress is per card id, so both directions share it. A word without a translation stays the right way round. `pickOptions` offers cards facing the same way first, so with a reversed and a normal collection both on, the right answer isn't the only option in its language. CSV files don't carry the direction |
| Audit results | [`audit-2026-10-31.md`](audit-2026-10-31.md): every finding of the 31 October review, its outcome, and the follow-up re-check |
| Interface texts in English, Russian and Spanish | `public/src/ui/i18n.js`: `data-i18n*` attributes in the HTML, `I18n.t()` in scripts |
| Study page (modes, stats, saving progress) | `public/src/study.js`, the modes in `public/src/features/flashcards/` |
| Study logic without the DOM (spaced repetition, quiz choices, swipes, opening mode, random order) | `public/src/features/study/progress.js`, `quiz-logic.js`, `swipe.js`, `mode.js`, `public/src/utils/shuffle-utils.js`, tested in `test/study.test.js` and `test/shuffle.test.js` |
| Flash Mode gestures | `public/src/features/flashcards/flashcard-mode.js`: a tap only turns the card; pointer events drag it, and past the threshold in `swipe.js` a swipe does what the buttons do. `touch-action: pan-y` on the card keeps vertical scrolling. `html` and `body` both have `overflow-x: clip`, so a card leaving the screen can't widen the page |
| Opening mode | The mode last chosen, per device (`flashcards-mode` in `localStorage`), set before the words load; a shortcut's `?mode=` wins for that visit and isn't saved |
| Collections and words | `public/src/features/vocabulary-manager/word-manager.js` (page; words and translations are edited in place in fields that grow to fit), `public/src/core/cloud.js` and `card-data.js` (storage) |
| CSV reading and writing | `public/src/utils/csv.js`, tested in `test/csv.test.js` |
| Starter collections | `public/collections/` with `index.json`. Each entry needs a `language` pair (`es-en`): an import carries it into the collection, and a test checks it's known. CSV files carry no language, so collections imported from a file or exported and re-imported set it in My Cards |
| Search engines | `public/robots.txt` and `public/sitemap.xml`, tested in `test/crawl.test.js`; not precached |
| App icon | `public/icons/icon-base.svg`; the PNGs in `icons/ios` and `icons/android` are rendered from it. Icon URLs carry `?v=N`: bump it everywhere (both pages, `manifest.json`, `sw.js`) when the icon changes, or phones keep the cached one |
| Launch screens | iOS: `public/icons/splash/`, the icon on the light or dark page background per screen size, linked from both pages with `prefers-color-scheme` media queries. Rendered by `scripts/make-launch-images.sh` (ImageMagick) from the sizes in `scripts/launch-images.txt`; rerun it when the icon or the background colours change. iOS picks one by the device's light or dark mode (not the in-app switch) and stores it when the app is added to the home screen. Android uses the manifest's single `background_color` (light) |
| Security rules | `firestore.rules`, tested in `test/firestore.rules.test.js` |
| Security headers | `firebase.json`: an enforced Content-Security-Policy on the pages (scripts only from the app, Google's CDN for Firebase, `apis.google.com` for sign-in and Google Tag Manager; no inline scripts, handlers or style attributes; `npm run dev` adds the emulator addresses in a generated, git-ignored `firebase.dev.json`, so the deployed policy has none; `scripts/dev-config.js`), plus `nosniff`, `X-Frame-Options: SAMEORIGIN` (Firebase Auth's frame is same-origin on yourflashcards.app), Referrer-Policy and Permissions-Policy. `test/app-shell.test.js` checks the pages stay inline-free. The emulators read headers at start-up, so restart `npm run dev` after changing them |
| Analytics | GA4 property `flashcards-ak-app` (measurement ID `G-E0J0MDFKE6`), loaded and sent by `public/src/utils/analytics.js`; skipped on localhost. The cookie note in the footer and on the sign-in screen (`public/src/ui/analytics-note.js`) lets people opt out per device (`flashcards-analytics` = `off` in `localStorage`): Analytics then never loads there, and turning it off mid-visit also sets `ga-disable-<id>` and deletes the `_ga` cookies. Events: `study_start`, `mode_switch`, `study_time`, `quiz_answer`, `card_marked`, `language_switch`, `progress_reset`, `pwa_*` |

Data lives under each user's uid; the rules allow nobody else in:

```text
users/{uid}/collections/{id}  { name, active, language?, reversed?, cards: [{ id, word, translation }], createdAt, updatedAt }
users/{uid}/meta/progress     { srs: { cardId: { box, due } }, updatedAt }
```

Progress is spaced repetition with Leitner boxes (`public/src/features/study/progress.js`, tested
in `test/study.test.js`): box 0 is new, boxes 1–5 come back after 1, 3, 7, 16 and 35 days, a
miss goes back to box 1 due now; `due` is in ms. It is saved as changes, not as a whole:
`Progress` records each changed entry, and `Cloud.saveProgressChanges` merges them in (`set` with
`merge`, `deleteField()` to forget one), at most every 2 seconds and when the page is hidden. Two
devices studying at once both keep their progress. Progress of deleted cards is pruned when the
study page loads. The rules refuse any other field, and any `updatedAt` other than the server's
clock.

Until 1.9.0 each card was a document of its own (`users/{uid}/cards`), and until 1.11.0
progress was `{ known, history }`. The app migrated both on load; on 1 November 2026 the last
remaining data was migrated server-side, and the migration code and the rules for the old layout
were removed. The old card path stayed readable by its owner for one release (1.13.1) so cached
1.12.1 apps could still load; 1.14.0 denies it.

A collection's cards live in its own document, at most 5,000 of them and at most about 1 MB of
text (Firestore allows 1 MiB per document; `cardsSize` in `card-data.js` measures it, and an
import or edit past it gets a translated "too long" message instead of Firestore's), so loading everything costs one read per collection, an import is a single
atomic write, and word edits are transactions on that document (`public/src/core/cloud.js`).
Firestore rules can't check list items, so `public/src/core/card-data.js` trims every card to
its fields and lengths.

## Development

Requires Node 22+, Java (for the emulators) and the Firebase CLI.

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` writes `firebase.dev.json` (firebase.json plus the emulator addresses in the
security policy) and starts the Auth, Firestore and Hosting emulators with it; open
http://127.0.0.1:5050. On
localhost the app talks to the emulators, so nothing touches production. Sign-in on localhost
always redirects to the emulator's page, where you create test Google accounts, because Claude's
in-app browser opens popups in the app's own tab, which fails with "No matching frame". The live
site uses the popup, so test that path on a preview channel. For scripted checks,
`window.Cloud.signInForTesting()` signs in without that page (`window.Cloud` exists only on the
emulators). Confirming an old sign-in before deleting an account still uses a popup, so on
localhost in the in-app browser delete within 4 minutes of signing in.

```bash
npm test
```

Runs the Firestore rules tests against a throwaway emulator, plus the CSV, starter-collection,
study-logic, shuffle, app-shell and XSS checks. (If `npm run dev` is already using port 8180, run
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8180 node --test test/*.test.js` instead.) The Auth and
Firestore emulators use 9199 and 8180, not the defaults, so they can run alongside another
project's emulators; `test/app-shell.test.js` keeps `cloud.js` in step with `firebase.json`.

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

Because of that, **Firestore rules must keep accepting what the previous app version does**:
rules deploy at once, while an installed app runs its old version for one more session. 1.13.0
broke this by denying the old card path that 1.12.1 still read on load ("Missing or insufficient
permissions" on the first open after the deploy); 1.13.1 let the owner read that empty path
again, and 1.14.0 removed it. Tighten rules one release after the app stops needing what they
remove.

The in-app browser of the Claude desktop app can't fetch service-worker scripts from the local
emulator (127.0.0.1); to try service-worker changes, deploy a preview channel:
`firebase hosting:channel:deploy <name> --expires 1d`.

Google sign-in is enabled under Authentication → Sign-in method in the
[Firebase console](https://console.firebase.google.com/project/flashcards-ak-app/authentication/providers)
(a console-only setting, needed again for any new project). A custom domain also has to be added
to Authentication → Settings → Authorized domains.

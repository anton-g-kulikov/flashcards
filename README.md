# YourFlashCards

A personal flashcards PWA for learning vocabulary on your phone. Sign in with Google, organise
words into collections, and learn them with flashcards and quizzes. Your collections and progress
sync across devices, and the app opens even without a connection (your words load once you're
back online).

**Try it here:** https://yourflashcards.app

## Using it

Signed out, the study page is a landing page that explains the app, with feature cards that turn
over like real flashcards. Sign in with Google to reach:

- **Study** (`index.html`): learn the words of every collection that's switched on, in Flash Mode
  or a multiple-choice Quiz Mode. See [How studying works](#how-studying-works).
- **My Cards** (`vocabulary-manager.html`): one collapsible card per collection. Its header
  switches it on or off for study and has rename, export and delete; open it to add words one at
  a time (the translation is optional and can be added later). Tap a word or its translation in
  the list to change it; long ones wrap onto more lines. **New**
  and **Import** at the top create collections. **Delete my account** at the bottom deletes your
  collections, progress and sign-in.
- **Interface language**: English, Russian or Spanish, from the header or the sign-in screen.
- **Study mode**: the page opens in the mode you last chose on that device.
- **Footer**: the tab on the line at the bottom of Study and My Cards opens it. It starts folded
  away each time.
- **Appearance**: light, dark, or matching the device (the default), from the switch in the
  footer. Saved on that device.
- **Analytics**: Google Analytics counts which features get used; the note in the footer and on
  the sign-in screen turns it off (or back on) for that device. See the [privacy page](https://yourflashcards.app/privacy.html).

## How studying works

### The words you study

The study page uses every word in the collections switched on in **My Cards**. It uses spaced
repetition: each word comes back for review after a growing interval, so you spend your time on
the words you're about to forget rather than the ones you know well. Your progress is saved to
your account and follows you to every device.

### Boxes and reviews

Every word sits in one of six boxes. New words start in box 0.

| Box | Comes back after |
| --- | --- |
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 16 days |
| 5 (mastered) | 35 days |

- **You know it** ("I know this!", or the right quiz answer on the first try): the word moves up
  one box and comes back after that box's interval.
- **You don't** ("I don't know…", or any wrong quiz answer): the word drops to box 1 and comes back
  later in the same session.

Both modes show what is **due** first, the words whose review date has passed, oldest first.
New words come after them. Words due on the same day, and new words, come in random order, so you
can't learn the list by its order. When nothing is left, you get an **All caught up** card that
says when the next review is.

The numbers above the cards are **Due** (to study now, new words included), **Learning** (boxes 1
to 4, not due yet) and **Mastered** (box 5, not due yet). The bar shows how far along the words are
on average, from all new to all mastered.

### Flash Mode

The card shows the word; tap it (or press Enter or Space) to flip between the word and the
translation. You can also swipe the card: right does what **I know this!** does, left what the
other button does.

- **I know this!** moves the word up a box; the card slides off to the right.
- **I don't know…** flips the card to show the translation and the button becomes **Next**. Tap the
  card to turn it back and forth as often as you like; press **Next** when you're ready to go on,
  and the card slides off to the left. The word comes
  back after ten other cards (or sooner, if fewer are left), the same as a missed word in the
  quiz.

### Quiz

The quiz asks "What does *word* mean?" about the next word due and offers up to four translations,
taken from all the words in your switched-on collections. No two options read the same. Words
without a translation can't be quizzed; study them in Flash Mode.

- **Right on the first try:** the word moves up a box.
- **Wrong answer:** that card turns over to show which word the translation actually belongs to,
  and you pick again. The word drops to box 1 and comes back after ten other questions (or
  sooner, if fewer words are left), so you have to remember it rather than recall it from a
  moment ago.

### Hearing a word

Set a collection's word and translation languages in **My Cards** (English, Spanish, Russian, French
or German; starter collections come with theirs). A speaker button then appears on the card and
next to the quiz question, for anything up to ten words. It uses your device's own voices, so how
it sounds depends on the device, and the button only shows when the device has a voice for that
language. If one is missing, you can usually add it in your device's language or speech settings.

The arrow between the two languages sets which side the card shows first: tap it to study Spanish →
English as English → Spanish. The words stay the same and so does your progress, which both
directions share. A word with no translation still shows the word first. The button below the
cards does the same while you study, for every collection switched on at once.

### Starting over

**Reset Progress** (below the cards) makes the words you're studying new again. Other collections
keep their progress. Switching a collection off keeps its progress too; switch it back on to
continue where you left off.

## Collections and CSV

A collection is a list of words with their translations. Collections move in and out of the app
as CSV files:

```csv
es,en
la casa,house
comer,to eat
hacer,"to do, to make"
```

- UTF-8, one word per line. The first line names the two columns: the word's language, then the
  translation's.
- Language codes are `en`, `es`, `ru`, `fr` and `de`. On import they set the collection's languages,
  so its words can be read aloud, and an export writes them back. For any other language, or if you
  don't want to say, use `word` or `translation` instead of a code (`word,translation`, `es,translation`).
- Quote a field that contains a comma or a double quote (`"to do, to make"`), and double any
  quote inside it.
- The translation may be empty. Other columns are ignored, and repeated words are skipped.
- Any language pair works: the app shows the first column on the card's face and quizzes you on the
  second, unless you swap the collection's direction in **My Cards**. The file doesn't store a swap.

[`public/collections/example.csv`](public/collections/example.csv) is a small example to copy
and edit.

### Export a collection from the app

1. Open **My Cards** (the button next to the YourCards title).
2. Tap the download icon in the collection's header. You get `<collection name>.csv`; on an
   iPhone, save it to Files or share it.

### Import someone else's collection

1. Get the CSV file: from a friend, or from [`public/collections/`](public/collections/) in this
   repository (open the file on GitHub, then **Download raw file**).
2. In **My Cards**, tap **Import → Choose a file**. It becomes a new collection named after
   the file, switched on for study. Nothing you already have is changed.

The collections in this repository are also listed under **Import → Starter collections**, so
you can add them in one tap, without downloading anything.

### Import from Anki

1. In Anki, choose **File → Export**, pick the deck, and set the format to **Notes in Plain Text
   (.txt)**.
2. In **My Cards**, tap **Import → Choose a file** and pick the `.txt` file.
3. Set the collection's languages in **My Cards** if you want to hear the words read aloud.

The first two fields of each note become the word and translation; the rest are left out. Markup
and sound references are removed. Every word starts as new, because Anki's review history doesn't
come across, and neither do images or audio. Cloze notes keep their `{{c1::…}}` text, so they aren't
worth importing. Anki's `.apkg` deck packages can't be imported.

Any tab-separated file works the same way.

### Starter collections

Spanish → English, 100 words each, in [`public/collections/es-en/`](public/collections/es-en/):

| Level | Nouns | Verbs | Adjectives | Adverbs |
| --- | --- | --- | --- | --- |
| A1 | [a1-nouns.csv](public/collections/es-en/a1-nouns.csv) | [a1-verbs.csv](public/collections/es-en/a1-verbs.csv) | [a1-adjectives.csv](public/collections/es-en/a1-adjectives.csv) | [a1-adverbs.csv](public/collections/es-en/a1-adverbs.csv) |
| A2 | [a2-nouns.csv](public/collections/es-en/a2-nouns.csv) | [a2-verbs.csv](public/collections/es-en/a2-verbs.csv) | [a2-adjectives.csv](public/collections/es-en/a2-adjectives.csv) | [a2-adverbs.csv](public/collections/es-en/a2-adverbs.csv) |

Importing one from **My Cards** also sets its languages, so its words can be read aloud. Nouns carry
their article (`la casa`), verbs are infinitives (`comer` → `to eat`) and adjectives
are masculine singular. No Spanish word appears in more than one of these eight collections.

## Contributing a collection

Have a word list others could use? Send it in, and it can become a starter collection in the app.

**First, make a CSV file** in the [format above](#collections-and-csv). The easiest way: build the
collection in the app, then export it with the download icon in its header. Or start from
[`example.csv`](public/collections/example.csv) and replace its words with yours. Give every word a
translation, and check the spelling (and, for nouns, the articles).

**Then send it**, whichever way suits you:

- **Open an issue (easiest).** Use the
  [New collection form](https://github.com/anton-g-kulikov/flashcards/issues/new?template=new-collection.yml):
  say which languages it covers and the level or topic, attach the CSV, and say where the words
  come from. All you need is a GitHub account.
- **Or open a pull request.** Fork this repository, add your file to
  [`public/collections/`](public/collections/) (on github.com: **Add file → Upload files**), and
  open a pull request with the same details in the description.

Only share lists you made yourself or are allowed to share. I'll review the words, put the file in
place and add it to the app's list.

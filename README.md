# YourCards

A personal flashcards PWA for learning vocabulary on your phone. Sign in with Google, organise
words into collections, and learn them with flashcards and quizzes. Your collections and progress
sync across devices, and the app opens even without a connection (your words load once you're
back online).

**Try it here:** https://yourflashcards.app

## Using it

- **Study** (`index.html`): learn the words of every collection that's switched on, with
  flashcards or a multiple-choice quiz. See [How studying works](#how-studying-works).
- **My Cards** (`vocabulary-manager.html`): one collapsible card per collection. Its header
  switches it on or off for study and has rename, export and delete; open it to add words one at
  a time (the translation is optional and can be added later) and edit or delete them. **New**
  and **Import** at the top create collections.
- **Interface language**: English, Russian or Spanish, from the header or the sign-in screen.

## How studying works

### The words you study

The study page uses every word in the collections switched on in **My Cards**. Each word is
either **known** or **not yet known**, and both modes only ever show the words you don't know
yet. The app also remembers when you last saw each word. Both are saved to your account, so
your progress follows you to every device.

### Flashcards

The card shows the word; tap it to flip to the translation.

- **I know this!** marks the word known and moves on. It won't come back.
- **I don't know…** flips the card to show the translation; tap the card when you're ready to go
  on. The word stays unknown and comes back later.
- When every word is known, you get a "All cards learned!" card.

### Quiz

The quiz asks "What does *word* mean?" and offers up to four translations, taken from other
words you don't know yet. It needs at least two such words that have a translation; words
without one are left out.

- **Right on the first try:** the word is marked known and leaves the quiz.
- **Wrong answer:** that card turns over to show which word the translation actually belongs to,
  and you pick again. Once you find the right one, the word stays unknown and comes back later.
- **One word left:** the app switches to Flashcards for it. When all are known, the quiz is
  complete.

### Which word comes next

The order is shuffled every time, so you can't learn the list by its order. The shuffle leans
towards words you haven't seen for a while: a word you've never seen or haven't seen for about
four days gets the most weight, one you saw in the last hour the least. About a third of the
time the order ignores that and is purely random.

### Starting over

**Reset Progress** (below the cards) marks the words you're studying as unknown again. Other
collections keep their progress. Switching a collection off keeps its progress too; switch it
back on to continue where you left off.

### Is this spaced repetition?

No. There are no review intervals and nothing is scheduled to come back: once a word is known,
it stays out of the rotation until you reset. The "least recently seen" weighting above only
changes the order of the words you don't know yet.

## Collections and CSV

A collection is a list of words with their translations. Collections move in and out of the app
as CSV files:

```csv
word,translation
la casa,house
comer,to eat
hacer,"to do, to make"
```

- UTF-8, first line `word,translation`, one word per line.
- Quote a field that contains a comma or a double quote (`"to do, to make"`), and double any
  quote inside it.
- The translation may be empty. Other columns are ignored, and repeated words are skipped.
- Any language pair works: the app shows `word` first and quizzes you on `translation`.

[`public/collections/example.csv`](public/collections/example.csv) is a small example to copy
and edit.

### Export a collection from the app

1. Open **My Cards** (the button next to the YourCards title).
2. Tap the download icon in the collection's header. You get `<collection name>.csv`; on an
   iPhone, save it to Files or share it.

### Import someone else's collection

1. Get the CSV file: from a friend, or from [`public/collections/`](public/collections/) in this
   repository (open the file on GitHub, then **Download raw file**).
2. In **My Cards**, tap **Import → Choose a CSV file**. It becomes a new collection named after
   the file, switched on for study. Nothing you already have is changed.

The collections in this repository are also listed under **Import → Starter collections**, so
you can add them in one tap, without downloading anything.

### Starter collections

Spanish → English, 100 words each, in [`public/collections/es-en/`](public/collections/es-en/):

| Level | Nouns | Verbs | Adjectives | Adverbs |
| --- | --- | --- | --- | --- |
| A1 | [a1-nouns.csv](public/collections/es-en/a1-nouns.csv) | [a1-verbs.csv](public/collections/es-en/a1-verbs.csv) | [a1-adjectives.csv](public/collections/es-en/a1-adjectives.csv) | [a1-adverbs.csv](public/collections/es-en/a1-adverbs.csv) |
| A2 | [a2-nouns.csv](public/collections/es-en/a2-nouns.csv) | [a2-verbs.csv](public/collections/es-en/a2-verbs.csv) | [a2-adjectives.csv](public/collections/es-en/a2-adjectives.csv) | [a2-adverbs.csv](public/collections/es-en/a2-adverbs.csv) |

Nouns carry their article (`la casa`), verbs are infinitives (`comer` → `to eat`) and adjectives
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

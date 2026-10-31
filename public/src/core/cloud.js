// Firebase access for the whole app: Google sign-in and the signed-in user's collection.
//
// The Firebase SDK comes straight from Google's CDN as ES modules, so the app needs no build step.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  arrayRemove,
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  memoryLocalCache,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import {
  DEFAULT_COLLECTION,
  MAX_CARDS,
  cardFields,
  collectionName,
  planMigration,
  storedCards,
} from "./card-data.js";

// Public by design: it identifies the project and grants nothing on its own. What protects a
// collection is firestore.rules, enforced server-side against the user's uid.
const firebaseConfig = {
  apiKey: "AIzaSyAWbQFwCgHbAnrxchnv-2pbF4X09zAFIs4",
  // On yourflashcards.app, sign-in runs on the app's own domain (Firebase Hosting serves
  // /__/auth/ there): Google's screen names yourflashcards.app, and the redirect fallback works
  // in browsers that block third-party storage. Its handler is registered in the OAuth client's
  // redirect URIs; any domain that isn't fails with redirect_uri_mismatch, so every other host
  // keeps the firebaseapp.com handler.
  authDomain:
    location.hostname === "yourflashcards.app" ? "yourflashcards.app" : "flashcards-ak-app.firebaseapp.com",
  projectId: "flashcards-ak-app",
  storageBucket: "flashcards-ak-app.firebasestorage.app",
  messagingSenderId: "523757398504",
  appId: "1:523757398504:web:c5f2d196ecfd974bf09c5d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Memory cache, not Firestore's IndexedDB cache: in Safari, opening that cache held up every
// read and write for over a minute (a HAR showed no Firestore request until 77 s after load,
// then every request answered in milliseconds), which left the study page on "Loading quiz…"
// and imports silent. The app itself still opens offline from the service worker; the words
// need a connection.
// The transport is left to the SDK: a streaming connection, or long polling where a proxy gets in
// the way. (Long polling used to be forced while the Safari stall above was blamed on streaming;
// the cache was the cause, and forced long polling only made every request slower.)
const db = initializeFirestore(app, { localCache: memoryLocalCache() });

// Local development runs against the Emulator Suite (`npm run dev`).
const usesEmulators = ["localhost", "127.0.0.1"].includes(location.hostname);
if (usesEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

function uid() {
  if (!auth.currentUser) throw new Error("Not signed in");
  return auth.currentUser.uid;
}

const collectionsRef = () => collection(db, "users", uid(), "collections");
const collectionRef = (id) => doc(collectionsRef(), id);
const progressRef = () => doc(db, "users", uid(), "meta", "progress");
// Where cards lived, one document each, before collections held them (see migrate)
const legacyCardsRef = () => collection(db, "users", uid(), "cards");

// A new random id, made locally like Firestore's own document ids
const newId = () => doc(collectionsRef()).id;

// A Firestore batch holds at most 500 writes.
const BATCH_LIMIT = 450;

async function commitInChunks(writes) {
  for (let start = 0; start < writes.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    writes.slice(start, start + BATCH_LIMIT).forEach((write) => write(batch));
    await batch.commit();
  }
}

// Moves cards from the old one-document-per-card layout into their collections, then deletes
// the old documents. Safe to interrupt: what was already moved is skipped next time.
async function migrate(collections, legacyDocs, defaultName) {
  const legacy = legacyDocs.map((card) => ({ id: card.id, ...card.data() }));
  const writes = planMigration(collections, legacy, defaultName, newId);
  const now = serverTimestamp();
  await commitInChunks([
    ...writes.map((write) => (batch) =>
      write.isNew
        ? batch.set(collectionRef(write.id), {
            name: write.name,
            active: true,
            cards: write.cards,
            createdAt: now,
            updatedAt: now,
          })
        : batch.update(collectionRef(write.id), { cards: write.cards, updatedAt: now })
    ),
    ...legacy.map((card) => (batch) => batch.delete(doc(legacyCardsRef(), card.id))),
  ]);

  const byId = new Map(collections.map((c) => [c.id, c]));
  for (const write of writes) {
    byId.set(write.id, { id: write.id, name: write.name, active: true, ...byId.get(write.id), cards: write.cards });
  }
  return [...byId.values()];
}

// Changes one collection's cards in a transaction, so edits from two devices don't overwrite
// each other. `edit` gets the current list and returns the new one.
function editCards(collectionId, edit) {
  return runTransaction(db, async (transaction) => {
    const ref = collectionRef(collectionId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("This collection no longer exists");
    transaction.update(ref, {
      cards: edit(storedCards(snapshot.data().cards)),
      updatedAt: serverTimestamp(),
    });
  });
}

function collectionFull() {
  const error = new Error(`A collection holds up to ${MAX_CARDS} words`);
  error.code = "collection-full";
  return error;
}

export const Cloud = {
  async signIn() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      // In-app browsers and some installed PWAs block popups: sign in on this page instead.
      if (error.code !== "auth/popup-blocked") throw error;
      await signInWithRedirect(auth, new GoogleAuthProvider());
    }
  },

  signOut() {
    return signOut(auth);
  },

  // Everything the user has: their collections, sorted by name, and every card with the id of
  // its collection, sorted by word. One read per collection. A first visit gets the default
  // collection, named in the interface language, so there is always somewhere to put words.
  async loadAll(defaultName) {
    // The old card documents are looked up too (an empty query costs one read), and moved
    const [snapshot, legacy] = await Promise.all([getDocs(collectionsRef()), getDocs(legacyCardsRef())]);
    let collections = snapshot.docs.map((c) => ({
      id: c.id,
      name: collectionName(c.data().name),
      active: c.data().active !== false,
      cards: storedCards(c.data().cards),
    }));
    if (!legacy.empty) collections = await migrate(collections, legacy.docs, defaultName);

    if (collections.length === 0) {
      const now = serverTimestamp();
      const name = collectionName(defaultName);
      await setDoc(collectionRef(DEFAULT_COLLECTION), {
        name,
        active: true,
        cards: [],
        createdAt: now,
        updatedAt: now,
      });
      collections.push({ id: DEFAULT_COLLECTION, name, active: true, cards: [] });
    }

    collections.sort((a, b) => a.name.localeCompare(b.name));
    const cards = collections
      .flatMap((c) => c.cards.map((card) => ({ ...card, collectionId: c.id })))
      .sort((a, b) => a.word.localeCompare(b.word, "es"));
    return { collections: collections.map(({ cards, ...rest }) => rest), cards };
  },

  // A new collection, empty or with the given cards (an import) in a single write, so an import
  // either arrives whole or not at all. Returns its id and the cards with their new ids.
  async createCollection(name, cards = []) {
    if (cards.length > MAX_CARDS) throw collectionFull();
    const id = newId();
    const stored = cards.map((card) => ({ id: newId(), ...cardFields(card) }));
    const now = serverTimestamp();
    await setDoc(collectionRef(id), {
      name: collectionName(name),
      active: true,
      cards: stored,
      createdAt: now,
      updatedAt: now,
    });
    return { id, cards: stored };
  },

  // Active collections are the ones the study page uses.
  setCollectionActive(id, active) {
    return updateDoc(collectionRef(id), { active: !!active, updatedAt: serverTimestamp() });
  },

  renameCollection(id, name) {
    return updateDoc(collectionRef(id), { name: collectionName(name), updatedAt: serverTimestamp() });
  },

  // Deletes a collection and its cards
  deleteCollection(id) {
    return deleteDoc(collectionRef(id));
  },

  // Adds a card ({ word, translation, collectionId }) and returns its id.
  async addCard(card) {
    const id = newId();
    await editCards(card.collectionId, (cards) => {
      if (cards.length >= MAX_CARDS) throw collectionFull();
      return [...cards, { id, ...cardFields(card) }];
    });
    return id;
  },

  updateCard(id, card) {
    return editCards(card.collectionId, (cards) =>
      cards.map((c) => (c.id === id ? { id, ...cardFields(card) } : c))
    );
  },

  deleteCard(id, collectionId) {
    return editCards(collectionId, (cards) => cards.filter((c) => c.id !== id));
  },

  async loadProgress() {
    const snapshot = await getDoc(progressRef());
    const data = snapshot.exists() ? snapshot.data() : {};
    return { known: data.known || [], history: data.history || {} };
  },

  // Saves what changed since the last save (Progress.takeChanges), merged into what is stored,
  // so progress saved meanwhile from another device is kept. The card ids are map keys here, not
  // field paths, so any id is safe.
  saveProgressChanges({ knownAdd, knownRemove, history }) {
    const ref = progressRef();
    const updatedAt = serverTimestamp();
    const batch = writeBatch(db);
    const seen = Object.fromEntries(
      Object.entries(history).map(([id, time]) => [id, time === null ? deleteField() : time])
    );
    batch.set(
      ref,
      { ...(knownAdd.length ? { known: arrayUnion(...knownAdd) } : {}), history: seen, updatedAt },
      { merge: true }
    );
    // A second write: one write can't both add to and remove from the same list
    if (knownRemove.length) {
      batch.set(ref, { known: arrayRemove(...knownRemove), updatedAt }, { merge: true });
    }
    return batch.commit();
  },
};

// Calls back with the signed-in user, or null, now and whenever that changes.
export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

// Emulator only: sign in as a test Google account without the popup, for automated checks
// (window.Cloud.signInForTesting() from the browser console). The Auth emulator accepts an
// unsigned token; production Auth would reject it.
if (usesEmulators) {
  Cloud.signInForTesting = (id = "test-user", name = "Test User") =>
    signInWithCredential(
      auth,
      GoogleAuthProvider.credential(
        JSON.stringify({ sub: id, email: `${id}@example.com`, name, email_verified: true })
      )
    );
  window.Cloud = Cloud;
}

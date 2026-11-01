// Firebase access for the whole app: Google sign-in and the signed-in user's collection.
//
// The Firebase SDK comes straight from Google's CDN as ES modules, so the app needs no build step.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
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
// A new random id, made locally like Firestore's own document ids
const newId = () => doc(collectionsRef()).id;

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

  // Deletes the account: every collection (with its cards), the progress record, then the
  // sign-in itself, which also signs out. Firebase only deletes a sign-in made in the last few
  // minutes, so an older one is confirmed first in Google's popup; that happens before anything
  // is deleted, so cancelling it leaves everything as it was.
  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");
    const signedInAt = Date.parse(user.metadata.lastSignInTime) || 0;
    if (Date.now() - signedInAt > 4 * 60 * 1000) {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }
    const snapshot = await getDocs(collectionsRef());
    const batch = writeBatch(db);
    snapshot.docs.forEach((collectionDoc) => batch.delete(collectionDoc.ref));
    batch.delete(progressRef());
    await batch.commit();
    await deleteUser(user);
  },

  // Everything the user has: their collections, sorted by name, and every card with the id of
  // its collection, sorted by word. One read per collection. A first visit gets the default
  // collection, named in the interface language, so there is always somewhere to put words.
  async loadAll(defaultName) {
    const snapshot = await getDocs(collectionsRef());
    const collections = snapshot.docs.map((c) => ({
      id: c.id,
      name: collectionName(c.data().name),
      active: c.data().active !== false,
      cards: storedCards(c.data().cards),
    }));

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

  // { srs: { cardId: { box, due } } }
  async loadProgress() {
    const snapshot = await getDoc(progressRef());
    return snapshot.exists() ? snapshot.data() : {};
  },

  // Saves what changed since the last save (Progress.takeChanges): single srs entries merged into
  // what is stored, so progress saved meanwhile from another device is kept. The card ids are
  // map keys here, not field paths, so any id is safe.
  saveProgressChanges({ srs }) {
    const data = {
      srs: Object.fromEntries(
        Object.entries(srs).map(([id, entry]) => [id, entry === null ? deleteField() : entry])
      ),
      updatedAt: serverTimestamp(),
    };
    return setDoc(progressRef(), data, { merge: true });
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

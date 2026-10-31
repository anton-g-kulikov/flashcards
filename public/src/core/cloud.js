// Firebase access for the whole app: Google sign-in and the signed-in user's collection.
//
// Loaded as an ES module straight from Google's CDN so the app keeps its no-build setup. Classic
// scripts reach it through window.Cloud and the "cloud-auth-changed" event.
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
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Public by design: it identifies the project and grants nothing on its own. What protects a
// collection is firestore.rules, enforced server-side against the user's uid.
const firebaseConfig = {
  apiKey: "AIzaSyAWbQFwCgHbAnrxchnv-2pbF4X09zAFIs4",
  // Google only accepts sign-in returns at the firebaseapp.com handler registered for this
  // project's OAuth client; any other domain fails with redirect_uri_mismatch.
  authDomain: "flashcards-ak-app.firebaseapp.com",
  projectId: "flashcards-ak-app",
  storageBucket: "flashcards-ak-app.firebasestorage.app",
  messagingSenderId: "523757398504",
  appId: "1:523757398504:web:c5f2d196ecfd974bf09c5d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Offline cache on, so studying keeps working without a connection, as it did before accounts.
// Single-tab: with the multi-tab manager one tab does the networking for all of them, and a
// frozen background tab could leave the others waiting forever. Another open tab now simply
// works from memory instead.
// Long polling: Safari stalled Firestore's default streaming connection for about a minute at a
// time (an import's writes reached the server 61 s after the tap; reads hung the same way), and
// auto-detection did not switch over in time. Plain long-poll requests work everywhere.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  experimentalForceLongPolling: true,
});

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

const cardsRef = () => collection(db, "users", uid(), "cards");
const collectionsRef = () => collection(db, "users", uid(), "collections");
const progressRef = () => doc(db, "users", uid(), "meta", "progress");

const text = (value, max) => String(value || "").trim().slice(0, max);

// Cards saved before collections existed have no collectionId; they belong to this one.
const DEFAULT_COLLECTION = "default";

// A Firestore batch holds at most 500 writes.
const BATCH_LIMIT = 450;

// The stored shape of a card: a word, its optional translation and its collection.
// Must match isCard() in firestore.rules.
function cardFields(card) {
  return {
    word: text(card.word, 200),
    translation: text(card.translation, 500),
    collectionId: text(card.collectionId, 100) || DEFAULT_COLLECTION,
  };
}

// Must match isCollection() in firestore.rules.
function collectionFields(name) {
  return { name: text(name, 100) };
}

async function commitInChunks(writes) {
  for (let start = 0; start < writes.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    writes.slice(start, start + BATCH_LIMIT).forEach((write) => write(batch));
    await batch.commit();
  }
}

window.Cloud = {
  user: null,
  authResolved: false,

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

  // The user's collections, sorted by name. A first visit gets the default collection, named
  // in the interface language, so there is always somewhere to put words.
  async loadCollections(defaultName) {
    const snapshot = await getDocs(collectionsRef());
    const collections = snapshot.docs.map((c) => ({
      id: c.id,
      ...collectionFields(c.data().name),
      active: c.data().active !== false,
    }));
    if (collections.length === 0) {
      const now = serverTimestamp();
      await setDoc(doc(collectionsRef(), DEFAULT_COLLECTION), {
        ...collectionFields(defaultName),
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      collections.push({ id: DEFAULT_COLLECTION, ...collectionFields(defaultName), active: true });
    }
    return collections.sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCollection(name) {
    const ref = doc(collectionsRef());
    const now = serverTimestamp();
    await setDoc(ref, { ...collectionFields(name), active: true, createdAt: now, updatedAt: now });
    return ref.id;
  },

  // Active collections are the ones the study page uses.
  setCollectionActive(id, active) {
    return updateDoc(doc(collectionsRef(), id), { active: !!active, updatedAt: serverTimestamp() });
  },

  renameCollection(id, name) {
    return updateDoc(doc(collectionsRef(), id), {
      ...collectionFields(name),
      updatedAt: serverTimestamp(),
    });
  },

  // Deletes a collection and the given cards (the ones in it).
  deleteCollection(id, cardIds) {
    return commitInChunks([
      ...cardIds.map((cardId) => (batch) => batch.delete(doc(cardsRef(), cardId))),
      (batch) => batch.delete(doc(collectionsRef(), id)),
    ]);
  },

  // Adds many cards to a collection at once; returns them with their new ids.
  async importCards(collectionId, cards) {
    const now = serverTimestamp();
    const added = cards.map((card) => ({
      id: doc(cardsRef()).id,
      ...cardFields({ ...card, collectionId }),
    }));
    await commitInChunks(
      added.map(({ id, ...fields }) => (batch) =>
        batch.set(doc(cardsRef(), id), { ...fields, createdAt: now, updatedAt: now })
      )
    );
    return added;
  },

  async loadCards() {
    const snapshot = await getDocs(cardsRef());
    return snapshot.docs
      .map((card) => ({ id: card.id, ...cardFields(card.data()) }))
      .sort((a, b) => a.word.localeCompare(b.word, "es"));
  },

  // Adds a card and returns its id.
  async addCard(card) {
    const ref = doc(cardsRef());
    const now = serverTimestamp();
    await setDoc(ref, { ...cardFields(card), createdAt: now, updatedAt: now });
    return ref.id;
  },

  updateCard(id, card) {
    return updateDoc(doc(cardsRef(), id), { ...cardFields(card), updatedAt: serverTimestamp() });
  },

  deleteCard(id) {
    return deleteDoc(doc(cardsRef(), id));
  },

  async loadProgress() {
    const snapshot = await getDoc(progressRef());
    const data = snapshot.exists() ? snapshot.data() : {};
    return { known: data.known || [], history: data.history || {} };
  },

  saveProgress({ known, history }) {
    return setDoc(progressRef(), { known, history, updatedAt: serverTimestamp() });
  },
};

// Emulator only: sign in as a test Google account without the popup, for automated checks.
// The Auth emulator accepts an unsigned token; production Auth would reject it.
if (usesEmulators) {
  window.Cloud.signInForTesting = (id = "test-user", name = "Test User") =>
    signInWithCredential(
      auth,
      GoogleAuthProvider.credential(
        JSON.stringify({ sub: id, email: `${id}@example.com`, name, email_verified: true })
      )
    );
}

onAuthStateChanged(auth, (user) => {
  window.Cloud.user = user;
  window.Cloud.authResolved = true;
  document.dispatchEvent(new CustomEvent("cloud-auth-changed", { detail: { user } }));
});

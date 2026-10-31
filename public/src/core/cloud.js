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
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Public by design: it identifies the project and grants nothing on its own. What protects a
// collection is firestore.rules, enforced server-side against the user's uid.
const firebaseConfig = {
  apiKey: "AIzaSyAWbQFwCgHbAnrxchnv-2pbF4X09zAFIs4",
  // On Firebase Hosting the sign-in handler is served from the app's own domain, which keeps the
  // redirect fallback same-origin (browsers block third-party storage on firebaseapp.com).
  authDomain: location.hostname.endsWith(".web.app")
    ? location.host
    : "flashcards-ak-app.firebaseapp.com",
  projectId: "flashcards-ak-app",
  storageBucket: "flashcards-ak-app.firebasestorage.app",
  messagingSenderId: "523757398504",
  appId: "1:523757398504:web:c5f2d196ecfd974bf09c5d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Offline cache on, so studying keeps working without a connection, as it did before accounts.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
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
const progressRef = () => doc(db, "users", uid(), "meta", "progress");

const text = (value, max) => String(value || "").trim().slice(0, max);

// The stored shape of a card: a word and its optional Russian translation.
// Must match isCard() in firestore.rules.
function cardFields(card) {
  return {
    word: text(card.word, 200),
    translation: text(card.translation, 500),
  };
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

// Firestore security rules tests. Run with `npm test` (starts the Firestore emulator).
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

let env;

const card = () => ({
  word: "abrir",
  translation: "открыть",
  collectionId: "k1",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-flashcards",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const as = (uid) => env.authenticatedContext(uid).firestore();

describe("cards stored one per document (before collections held them)", () => {
  it("can be read and deleted by their owner, for the move into collections", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/cards/c1"), card());
    });
    const ref = doc(as("alice"), "users/alice/cards/c1");
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });

  it("can't be created or changed any more", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/cards/c1"), card());
    });
    const db = as("alice");
    await assertFails(setDoc(doc(db, "users/alice/cards/c2"), card()));
    await assertFails(updateDoc(doc(db, "users/alice/cards/c1"), { translation: "x" }));
  });

  it("are kept away from other users and signed-out visitors", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/cards/c1"), card());
    });
    await assertFails(getDoc(doc(as("bob"), "users/alice/cards/c1")));
    await assertFails(deleteDoc(doc(as("bob"), "users/alice/cards/c1")));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice/cards/c1")));
  });
});

describe("collections", () => {
  const collection = (overrides = {}) => ({
    name: "A1 Nouns",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  });

  it("lets a user create, rename and delete their own collections", async () => {
    const ref = doc(as("alice"), "users/alice/collections/k1");
    await assertSucceeds(setDoc(ref, collection()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { name: "Nouns", updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
  });

  it("keeps other users away from someone's collections", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/collections/k1"), { name: "Mine" });
    });
    await assertFails(getDoc(doc(as("bob"), "users/alice/collections/k1")));
    await assertFails(setDoc(doc(as("bob"), "users/alice/collections/k2"), collection()));
    await assertFails(deleteDoc(doc(as("bob"), "users/alice/collections/k1")));
  });

  it("rejects collections without a name, with a long name or unknown fields", async () => {
    const db = as("alice");
    await assertFails(setDoc(doc(db, "users/alice/collections/k1"), collection({ name: "" })));
    await assertFails(
      setDoc(doc(db, "users/alice/collections/k2"), collection({ name: "x".repeat(101) }))
    );
    await assertFails(setDoc(doc(db, "users/alice/collections/k3"), collection({ public: true })));
  });

  it("lets a collection be switched off and on, with a true/false flag only", async () => {
    const db = as("alice");
    const ref = doc(db, "users/alice/collections/k1");
    await assertSucceeds(setDoc(ref, collection({ active: true })));
    await assertSucceeds(updateDoc(ref, { active: false, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { active: "no" }));
  });

  it("holds its cards as a list of up to 5,000", async () => {
    const db = as("alice");
    const cards = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, word: `w${i}`, translation: "" }));
    const ref = doc(db, "users/alice/collections/k1");
    await assertSucceeds(setDoc(ref, collection({ cards: cards(5000) })));
    await assertSucceeds(updateDoc(ref, { cards: cards(3), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { cards: cards(5001) }));
    await assertFails(setDoc(doc(db, "users/alice/collections/k2"), collection({ cards: { c1: "x" } })));
  });
});

describe("progress", () => {
  it("lets a user save and read their own progress", async () => {
    const db = as("alice");
    const ref = doc(db, "users/alice/meta/progress");
    await assertSucceeds(
      setDoc(ref, { known: ["c1"], history: { c1: 1730000000000 }, updatedAt: serverTimestamp() })
    );
    await assertSucceeds(getDoc(ref));
  });

  it("keeps other users away from someone's progress", async () => {
    await assertFails(getDoc(doc(as("bob"), "users/alice/meta/progress")));
    await assertFails(setDoc(doc(as("bob"), "users/alice/meta/progress"), { known: [] }));
  });

  it("caps the history at 20,000 cards, like the known list", async () => {
    const big = Object.fromEntries(Array.from({ length: 20001 }, (_, i) => [`c${i}`, 1]));
    await assertFails(setDoc(doc(as("alice"), "users/alice/meta/progress"), { known: [], history: big }));
  });

  it("rejects progress with unexpected fields", async () => {
    await assertFails(
      setDoc(doc(as("alice"), "users/alice/meta/progress"), { known: [], score: 10 })
    );
  });
});

describe("everything else", () => {
  it("denies the user document and other meta documents", async () => {
    const db = as("alice");
    await assertFails(setDoc(doc(db, "users/alice"), { name: "Alice" }));
    await assertFails(getDoc(doc(db, "users/alice")));
    await assertFails(setDoc(doc(db, "users/alice/meta/settings"), { theme: "dark" }));
  });
});

// Firestore security rules tests. Run with `npm test` (starts the Firestore emulator).
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

let env;

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

describe("cards outside collections (the layout before 1.9.0)", () => {
  it("can be read by their owner, so an older cached version still loads, but not written", async () => {
    const db = as("alice");
    await assertSucceeds(getDocs(collection(db, "users/alice/cards")));
    await assertFails(setDoc(doc(db, "users/alice/cards/c1"), { word: "abrir" }));
    await assertFails(deleteDoc(doc(db, "users/alice/cards/c1")));
  });

  it("stay closed to other users", async () => {
    await assertFails(getDocs(collection(as("bob"), "users/alice/cards")));
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
      setDoc(ref, { srs: { c1: { box: 1, due: 1730000000000 } }, updatedAt: serverTimestamp() })
    );
    await assertSucceeds(getDoc(ref));
  });

  it("takes spaced-repetition entries merged in, one card at a time", async () => {
    const ref = doc(as("alice"), "users/alice/meta/progress");
    const now = serverTimestamp();
    await assertSucceeds(setDoc(ref, { srs: { c1: { box: 2, due: 5 } }, updatedAt: now }, { merge: true }));
    await assertSucceeds(setDoc(ref, { srs: { c2: { box: 1, due: 6 } }, updatedAt: now }, { merge: true }));
    await assertSucceeds(setDoc(ref, { srs: { c1: deleteField() }, updatedAt: now }, { merge: true }));
    const saved = (await getDoc(ref)).data();
    assert.deepEqual(saved.srs, { c2: { box: 1, due: 6 } });
  });

  it("refuses the fields of progress from before spaced repetition", async () => {
    const ref = doc(as("alice"), "users/alice/meta/progress");
    await assertFails(setDoc(ref, { known: ["c1"], updatedAt: serverTimestamp() }));
    await assertFails(setDoc(ref, { srs: {}, history: {}, updatedAt: serverTimestamp() }));
  });

  it("caps srs at 20,000 cards", async () => {
    const big = Object.fromEntries(Array.from({ length: 20001 }, (_, i) => [`c${i}`, { box: 1, due: 1 }]));
    await assertFails(setDoc(doc(as("alice"), "users/alice/meta/progress"), { srs: big }));
  });

  it("accepts only the server's clock as updatedAt", async () => {
    const stale = Timestamp.fromMillis(Date.now() - 60_000);
    await assertFails(setDoc(doc(as("alice"), "users/alice/meta/progress"), { srs: {}, updatedAt: stale }));
    await assertFails(setDoc(doc(as("alice"), "users/alice/collections/k1"), { name: "A", updatedAt: stale }));
  });

  it("keeps other users away from someone's progress", async () => {
    await assertFails(getDoc(doc(as("bob"), "users/alice/meta/progress")));
    await assertFails(setDoc(doc(as("bob"), "users/alice/meta/progress"), { srs: {} }));
  });

  it("rejects progress with unexpected fields", async () => {
    await assertFails(
      setDoc(doc(as("alice"), "users/alice/meta/progress"), { srs: {}, score: 10 })
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

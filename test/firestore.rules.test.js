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

const card = (overrides = {}) => ({
  word: "abrir",
  translation: "открыть",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
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

describe("cards", () => {
  it("lets a user create, read, update and delete their own cards", async () => {
    const db = as("alice");
    const ref = doc(db, "users/alice/cards/c1");
    await assertSucceeds(setDoc(ref, card()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { translation: "открывать", updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
  });

  it("accepts a card with only a word", async () => {
    await assertSucceeds(setDoc(doc(as("alice"), "users/alice/cards/c1"), { word: "hola" }));
  });

  it("keeps other users out of a collection", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/cards/c1"), { word: "abrir" });
    });
    const bob = as("bob");
    await assertFails(getDoc(doc(bob, "users/alice/cards/c1")));
    await assertFails(setDoc(doc(bob, "users/alice/cards/c2"), card()));
    await assertFails(deleteDoc(doc(bob, "users/alice/cards/c1")));
  });

  it("keeps signed-out visitors out", async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/alice/cards/c1")));
    await assertFails(setDoc(doc(anon, "users/alice/cards/c1"), card()));
  });

  it("rejects cards with unknown fields, no word, or oversized values", async () => {
    const db = as("alice");
    await assertFails(setDoc(doc(db, "users/alice/cards/c1"), card({ owner: "bob" })));
    await assertFails(setDoc(doc(db, "users/alice/cards/c2"), { translation: "открыть" }));
    await assertFails(setDoc(doc(db, "users/alice/cards/c3"), card({ word: "" })));
    await assertFails(setDoc(doc(db, "users/alice/cards/c4"), card({ word: "x".repeat(201) })));
    await assertFails(setDoc(doc(db, "users/alice/cards/c5"), card({ translation: 42 })));
    await assertFails(setDoc(doc(db, "users/alice/cards/c6"), card({ category: "verb" })));
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

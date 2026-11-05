// Reading words aloud: which voice, and what is short enough to speak.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_SPOKEN_WORDS, findVoice, speak, speakable } from "../public/src/features/study/speech.js";

const voice = (lang, localService = true) => ({ lang, localService });

describe("findVoice", () => {
  it("matches on the language, whatever the region or spelling", () => {
    assert.equal(findVoice([voice("es-ES")], "es").lang, "es-ES");
    assert.equal(findVoice([voice("es_MX")], "es").lang, "es_MX"); // Android
    assert.equal(findVoice([voice("ES-es")], "es").lang, "ES-es");
  });

  it("prefers a voice on the device over an online one", () => {
    const local = voice("es-MX", true);
    assert.equal(findVoice([voice("es-ES", false), local], "es"), local);
  });

  it("falls back to an online voice, and finds nothing for a missing language", () => {
    assert.equal(findVoice([voice("ru-RU", false)], "ru").lang, "ru-RU");
    assert.equal(findVoice([voice("en-US")], "ru"), null);
    assert.equal(findVoice([], "ru"), null);
  });

  it("doesn't mistake one language for another that starts the same", () => {
    assert.equal(findVoice([voice("est-EE")], "es"), null);
  });
});

describe("speakable", () => {
  it("takes one to ten words", () => {
    assert.ok(speakable("hola"));
    assert.ok(speakable("  a pesar de que  "));
    assert.ok(speakable(Array(MAX_SPOKEN_WORDS).fill("w").join(" ")));
  });

  it("leaves out empty text and anything longer", () => {
    assert.ok(!speakable(""));
    assert.ok(!speakable("   "));
    assert.ok(!speakable(undefined));
    assert.ok(!speakable(Array(MAX_SPOKEN_WORDS + 1).fill("w").join(" ")));
  });
});

describe("speak", () => {
  const spoken = [];
  let cancelled = 0;
  globalThis.SpeechSynthesisUtterance = class {
    volume = 1;
    constructor(text) {
      this.text = text;
    }
  };
  globalThis.speechSynthesis = {
    speaking: false,
    pending: false,
    getVoices: () => [voice("es-ES")],
    cancel: () => cancelled++,
    speak: (utterance) => spoken.push(utterance),
  };

  it("wakes the audio with a silent sound before the first word, and only then", () => {
    speak("hola", "es");
    assert.deepEqual(spoken.map((u) => [u.text, u.volume]), [["a", 0], ["hola", 1]]);
    assert.equal(spoken[0].lang, "es-ES");

    spoken.length = 0;
    speak("adiós", "es");
    assert.deepEqual(spoken.map((u) => [u.text, u.volume]), [["adiós", 1]]);
  });

  it("cancels only what is actually playing", () => {
    assert.equal(cancelled, 0);
    speechSynthesis.speaking = true;
    speak("otra", "es");
    assert.equal(cancelled, 1);
  });

  it("says nothing without a voice for the language", () => {
    spoken.length = 0;
    speak("привет", "ru");
    assert.deepEqual(spoken, []);
  });
});


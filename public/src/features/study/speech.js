// Reading words aloud with the browser's own speech (the Web Speech API): free, no server, and
// the voices are whatever this device has. Quality and languages differ per device, so a speaker
// button only shows when the device has a voice for the language. The choices are kept apart from
// the page, so the tests can import them.

// Longer text is a sentence, not a word to practise
export const MAX_SPOKEN_WORDS = 10;

const voiceLanguage = (voice) => voice.lang.toLowerCase().replace("_", "-").split("-")[0];

// A voice for a language code ("es"), preferring one on the device: online voices send the text
// to their provider
export function findVoice(voices, language) {
  const matching = voices.filter((voice) => voiceLanguage(voice) === language);
  return matching.find((voice) => voice.localService) ?? matching[0] ?? null;
}

export function speakable(text) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= MAX_SPOKEN_WORDS;
}

const available = () => (typeof speechSynthesis === "undefined" ? [] : speechSynthesis.getVoices());

export function hasVoice(language) {
  return !!findVoice(available(), language);
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

function speak(text, language) {
  const voice = findVoice(available(), language);
  if (!voice) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  speechSynthesis.speak(utterance);
}

// A speaker button for this text, or null when it can't be spoken: no language set, or too long.
// It sits on a card that can be tapped and swiped, so its own taps stop here.
export function speakButton(text, language, label) {
  if (!language || !speakable(text)) return null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "speak-btn";
  button.dataset.language = language;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.hidden = !hasVoice(language);
  button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>
  </svg>`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    speak(text.trim(), language);
  });
  for (const type of ["pointerdown", "keydown"]) {
    button.addEventListener(type, (event) => event.stopPropagation());
  }
  return button;
}

// Calls back when the device's voices arrive, which can be after the page has drawn
export function onVoicesChanged(callback) {
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.addEventListener("voiceschanged", callback);
  }
}

onVoicesChanged(() => {
  document.querySelectorAll(".speak-btn").forEach((button) => {
    button.hidden = !hasVoice(button.dataset.language);
  });
});

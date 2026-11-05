// Which study mode the page opens in. No DOM or storage here: the tests import it directly.

const MODES = ["flashcard", "quiz"];

// A home-screen shortcut's ?mode= comes first, then the mode last chosen on this device. Quiz is
// the default.
export function initialMode(requested, saved) {
  return [requested, saved].find((mode) => MODES.includes(mode)) ?? "quiz";
}

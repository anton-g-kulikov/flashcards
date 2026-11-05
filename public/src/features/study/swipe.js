// When a drag on a flashcard counts as a swipe. No DOM here: the tests import it directly.

// How far a finger moves before the drag is read as sideways (a swipe) or up and down (a scroll)
const AXIS_PX = 10;
// A swipe has to cross this share of the card's width, or this distance if that is less
const SWIPE_SHARE = 0.3;
const SWIPE_MAX_PX = 100;

// "horizontal", "vertical", or null while it's too early to tell
export function dragAxis(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_PX) return null;
  return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
}

// "right", "left", or null for a drag too short to count: the card springs back
export function swipeDirection(dx, cardWidth) {
  if (Math.abs(dx) < Math.min(cardWidth * SWIPE_SHARE, SWIPE_MAX_PX)) return null;
  return dx > 0 ? "right" : "left";
}

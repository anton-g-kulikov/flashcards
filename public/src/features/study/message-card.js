// The flashcard-style cards the study page shows in place of words ("All cards learned!", "A quiz
// needs at least 2 words"...): the front says what happened, the back what to do next. They turn
// over by themselves after a moment; a tap, Enter or Space turns them again.

export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Runs the handler on a click, or on Enter or Space while the element has focus
export function onActivate(element, handler) {
  element.addEventListener("click", handler);
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handler(event);
  });
}

// Fills a .flashcard element with a message. `tone` colours the front (warning, success, accent);
// `hintHtml` is trusted markup from the translations, with any word in it escaped.
export function renderMessage(card, { tone, badge, title, text, hintHtml }) {
  const front = el("div", `card-face card-front${tone ? ` tone-${tone}` : ""}`);
  if (badge) front.append(el("div", "category-badge", badge));
  front.append(el("div", "spanish-word", title));

  const back = el("div", "card-face card-back");
  if (text) back.append(el("div", "translation", text));
  if (hintHtml) {
    const hint = el("div", "example");
    hint.innerHTML = hintHtml;
    back.append(hint);
  }
  card.classList.remove("flipped");
  card.replaceChildren(front, back);
}

// A message card of its own, replacing the contents of `container` (the quiz's options)
export function showMessageCard(container, message, flipAfter) {
  const wrapper = el("div", "flashcard-container");
  const card = el("div", "flashcard");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  renderMessage(card, message);
  onActivate(card, () => card.classList.toggle("flipped"));
  wrapper.append(card);
  container.replaceChildren(wrapper);
  if (flipAfter) setTimeout(() => card.classList.add("flipped"), flipAfter);
  return card;
}

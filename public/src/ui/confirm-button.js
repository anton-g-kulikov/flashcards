// Two-step confirmation on the button itself, used instead of confirm(): some browsers (in-app
// browsers, embedded previews) suppress native dialogs, and a suppressed confirm() returns false,
// which silently cancels the action.
//
// Returns true when this click confirms the action; otherwise arms the button for 3 seconds.
function confirmOnSecondTap(button, prompt = "Tap again to confirm") {
  if (button.dataset.armed === "true") {
    disarmButton(button);
    return true;
  }

  button.dataset.armed = "true";
  button.dataset.originalHtml = button.innerHTML;
  button.textContent = prompt;
  button.classList.add("armed");
  button.disarmTimer = setTimeout(() => disarmButton(button), 3000);
  return false;
}

function disarmButton(button) {
  clearTimeout(button.disarmTimer);
  button.dataset.armed = "false";
  button.innerHTML = button.dataset.originalHtml;
  button.classList.remove("armed");
}

window.confirmOnSecondTap = confirmOnSecondTap;

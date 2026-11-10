import { getNextPage, redirectIfAuthenticated, register } from "./auth.js";
import { clearMessage, errorText, renderHeader, showMessage } from "./ui.js";

const message = document.getElementById("message");

function main() {
  if (redirectIfAuthenticated()) return;
  renderHeader();

  const next = getNextPage();
  const params = next ? `?next=${encodeURIComponent(next)}` : "";
  document.getElementById("login-link").href = `login.html${params}`;

  document
    .getElementById("register-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      clearMessage(message);
      const payload = Object.fromEntries(new FormData(event.target));
      try {
        await register(payload);
        const registered = next
          ? `?registered=1&next=${encodeURIComponent(next)}`
          : "?registered=1";
        location.replace(`login.html${registered}`);
      } catch (error) {
        // Помилки валідації приходять по полях: показуємо їх усі одразу.
        showMessage(message, errorText(error));
      }
    });
}

main();

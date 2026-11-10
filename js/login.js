import { getNextPage, login, redirectIfAuthenticated } from "./auth.js";
import { clearMessage, errorText, renderHeader, showMessage } from "./ui.js";

const message = document.getElementById("message");

function main() {
  // Авторизований користувач не має бачити сторінку логіну.
  if (redirectIfAuthenticated()) return;
  renderHeader();

  const next = getNextPage();
  if (next) {
    // Зберігаємо next, якщо користувач піде на реєстрацію.
    const link = document.getElementById("register-link");
    link.href = `register.html?next=${encodeURIComponent(next)}`;
  }
  if (new URLSearchParams(location.search).has("registered")) {
    showMessage(message, "Реєстрацію завершено. Тепер увійдіть.", "success");
  }

  document
    .getElementById("login-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      clearMessage(message);
      const form = new FormData(event.target);
      try {
        await login(form.get("username").trim(), form.get("password"));
        // Повертаємо користувача туди, звідки його відправили на логін.
        location.replace(next ?? "index.html");
      } catch (error) {
        showMessage(message, errorText(error));
      }
    });
}

main();

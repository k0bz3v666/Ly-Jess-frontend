import { authFetch, requireAuth } from "./auth.js";
import { el, errorText, renderHeader, showMessage } from "./ui.js";

const message = document.getElementById("message");

async function main() {
  // Неавторизованого користувача відправляє на логін, а після входу
  // повертає сюди.
  if (!requireAuth()) return;
  renderHeader();

  try {
    const user = await authFetch("/auth/me");
    const rows = [
      ["Username", user.username],
      ["Ім'я", user.first_name || "—"],
      ["Прізвище", user.last_name || "—"],
      ["Email", user.email],
      ["Роль", user.is_staff ? "Адміністратор" : "Користувач"],
    ];
    const profile = document.getElementById("profile");
    profile.replaceChildren(
      ...rows.flatMap(([label, value]) => [
        el("dt", { textContent: label }),
        el("dd", { textContent: value }),
      ]),
    );
    profile.hidden = false;
  } catch (error) {
    showMessage(message, errorText(error));
  }
}

main();

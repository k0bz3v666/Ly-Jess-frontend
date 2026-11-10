import { ApiError, getUser, isAuthenticated, logout } from "./auth.js";

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// Шапка сайту. Вміст залежить від того, чи авторизований користувач.
export function renderHeader() {
  const header = document.getElementById("site-header");
  const user = getUser();
  const nav = el("nav", { className: "nav" });
  nav.append(el("a", { href: "index.html", textContent: "Каталог" }));

  if (isAuthenticated()) {
    nav.append(el("a", { href: "profile.html", textContent: "Профіль" }));
    if (user?.is_staff) {
      nav.append(el("a", { href: "admin.html", textContent: "Адмінка" }));
    }
    const logoutButton = el("button", {
      type: "button",
      className: "button secondary",
      textContent: "Вийти",
    });
    logoutButton.addEventListener("click", logout);
    nav.append(
      el("span", {
        className: "spacer user-name",
        textContent: user?.first_name || user?.username || "",
      }),
      logoutButton,
    );
  } else {
    nav.append(
      el("span", { className: "spacer" }),
      el("a", {
        href: "login.html",
        className: "button",
        textContent: "Увійти",
      }),
      el("a", { href: "register.html", textContent: "Реєстрація" }),
    );
  }
  header.replaceChildren(el("div", { className: "container" }, nav));
}

// Показує повідомлення в елементі-контейнері: помилку або успіх.
export function showMessage(container, text, type = "error") {
  container.className = `message ${type}`;
  container.textContent = text;
  container.hidden = false;
}

export function clearMessage(container) {
  container.hidden = true;
  container.textContent = "";
}

// Перетворює помилку API на текст: загальне повідомлення і помилки по полях.
export function errorText(error) {
  if (!(error instanceof ApiError)) {
    return "Не вдалося зв'язатися із сервером. Перевірте, чи запущено бекенд.";
  }
  const lines = [error.message];
  for (const [field, messages] of Object.entries(error.details ?? {})) {
    const list = Array.isArray(messages) ? messages : [messages];
    lines.push(`${field}: ${list.join(" ")}`);
  }
  return lines.join("\n");
}

export { el };

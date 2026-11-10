import { API_URL } from "./config.js";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";
const JSON_HEADERS = { "Content-Type": "application/json" };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? `Помилка ${status}`);
    this.status = status;
    this.details = body?.details ?? null;
  }
}

// ---------- токени та користувач ----------

function tokenExpiresAt(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

function isExpired(token) {
  return !token || tokenExpiresAt(token) <= Date.now();
}

function saveSession({ access, refresh, user }) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach((key) =>
    localStorage.removeItem(key),
  );
}

// Користувач увійшов, поки живий refresh токен: за його допомогою завжди
// можна отримати новий access. Прострочену сесію одразу очищаємо.
export function isAuthenticated() {
  if (isExpired(localStorage.getItem(REFRESH_KEY))) {
    clearSession();
    return false;
  }
  return true;
}

export function getUser() {
  if (!isAuthenticated()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

// ---------- запити до API ----------

async function parseResponse(response) {
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new ApiError(response.status, body);
  return body;
}

function request(path, options = {}, token = null) {
  const headers = { ...(options.body ? JSON_HEADERS : {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// Запит без токена: для відкритих ендпоінтів. Токен не додаємо навмисно,
// бо прострочений токен у заголовку дав би 401 навіть на публічному GET.
export async function publicFetch(path, options = {}) {
  return parseResponse(await request(path, options));
}

// Усі одночасні запити, яким потрібен новий access, чекають на один refresh.
let refreshing = null;

function refreshAccessToken() {
  refreshing ??= (async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (isExpired(refresh)) return null;
    const response = await request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return null;
    const { access } = await response.json();
    localStorage.setItem(ACCESS_KEY, access);
    return access;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// Запит із токеном. Якщо access прострочений, оновлює його через refresh
// і повторює запит один раз. Якщо refresh теж недійсний, виходить з акаунта.
export async function authFetch(path, options = {}) {
  let access = localStorage.getItem(ACCESS_KEY);
  if (isExpired(access)) access = await refreshAccessToken();

  let response = access ? await request(path, options, access) : null;
  if (response?.status === 401) {
    access = await refreshAccessToken();
    response = access ? await request(path, options, access) : null;
  }
  if (!response) {
    clearSession();
    redirectToLogin();
    throw new ApiError(401, { error: "Сесія завершилась. Увійдіть знову." });
  }
  return parseResponse(response);
}

// ---------- дії користувача ----------

export async function login(username, password) {
  const data = await publicFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveSession(data);
  return data.user;
}

export function register(payload) {
  return publicFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  clearSession();
  location.replace("index.html");
}

// ---------- перенаправлення ----------

// Приймаємо лише імена наших сторінок (profile.html, admin.html?x=1), щоб
// параметр next не можна було використати для переходу на чужий сайт.
const SAFE_NEXT = /^[A-Za-z0-9_-]+\.html(\?[^#]*)?$/;

export function redirectToLogin() {
  const page = location.pathname.split("/").pop() || "index.html";
  const next = encodeURIComponent(page + location.search);
  location.replace(`login.html?next=${next}`);
}

export function getNextPage() {
  const next = new URLSearchParams(location.search).get("next");
  return next && SAFE_NEXT.test(next) ? next : null;
}

// Для сторінок, доступних лише авторизованим. Повертає false, якщо
// користувача відправлено на логін.
export function requireAuth() {
  if (isAuthenticated()) return true;
  redirectToLogin();
  return false;
}

// Для сторінок входу й реєстрації. Повертає true, якщо користувач уже
// авторизований і його відправлено на сторінку з контентом.
export function redirectIfAuthenticated() {
  if (!isAuthenticated()) return false;
  location.replace("index.html");
  return true;
}

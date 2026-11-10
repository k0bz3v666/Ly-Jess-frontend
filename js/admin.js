import { authFetch, getUser, publicFetch, requireAuth } from "./auth.js";
import {
  clearMessage,
  el,
  errorText,
  renderHeader,
  showMessage,
} from "./ui.js";

const message = document.getElementById("message");
const list = document.getElementById("products");

function fillSelect(select, items) {
  select.replaceChildren(
    ...items.map((item) =>
      el("option", { value: item.id, textContent: item.name }),
    ),
  );
}

async function loadProducts() {
  const products = await publicFetch("/products");
  list.replaceChildren(
    ...products.map((product) => {
      const remove = el("button", {
        type: "button",
        className: "button danger",
        textContent: "Видалити",
      });
      remove.addEventListener("click", () => removeProduct(product));
      return el(
        "li",
        { className: "card" },
        el("strong", { textContent: product.name }),
        el("span", { textContent: `${product.price} грн` }),
        remove,
      );
    }),
  );
}

async function removeProduct(product) {
  if (!confirm(`Видалити «${product.name}»?`)) return;
  clearMessage(message);
  try {
    await authFetch(`/products/${product.id}`, { method: "DELETE" });
    await loadProducts();
  } catch (error) {
    showMessage(message, errorText(error));
  }
}

async function addProduct(event) {
  event.preventDefault();
  clearMessage(message);
  const data = Object.fromEntries(new FormData(event.target));
  const body = {
    ...data,
    price: Number(data.price),
    stock: Number(data.stock),
    category_id: Number(data.category_id),
    brand_id: Number(data.brand_id),
  };
  try {
    await authFetch("/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
    event.target.reset();
    showMessage(message, "Товар додано.", "success");
    await loadProducts();
  } catch (error) {
    showMessage(message, errorText(error));
  }
}

async function main() {
  if (!requireAuth()) return;
  renderHeader();

  // Сторінка лише для адміністраторів. Це лише зручність інтерфейсу:
  // справжній захист на бекенді, який відповість 403 будь-кому іншому.
  if (!getUser()?.is_staff) {
    showMessage(message, "Ця сторінка доступна лише адміністраторам.");
    return;
  }

  try {
    const [categories, brands] = await Promise.all([
      publicFetch("/categories"),
      publicFetch("/brands"),
    ]);
    fillSelect(document.getElementById("category"), categories);
    fillSelect(document.getElementById("brand"), brands);
    await loadProducts();
    document.getElementById("admin-content").hidden = false;
    document
      .getElementById("product-form")
      .addEventListener("submit", addProduct);
  } catch (error) {
    showMessage(message, errorText(error));
  }
}

main();

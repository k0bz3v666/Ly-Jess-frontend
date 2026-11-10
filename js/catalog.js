import { publicFetch } from "./auth.js";
import {
  clearMessage,
  el,
  errorText,
  renderHeader,
  showMessage,
} from "./ui.js";

const ANIMALS = {
  cat: "Кіт",
  dog: "Собака",
  rodent: "Гризун",
  bird: "Птах",
  fish: "Рибки",
};

const list = document.getElementById("products");
const message = document.getElementById("message");

async function loadProducts(search = "") {
  clearMessage(message);
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const products = await publicFetch(`/products${query}`);
    list.replaceChildren(
      ...products.map((product) =>
        el(
          "li",
          { className: "card" },
          el("strong", { textContent: product.name }),
          el("span", {
            textContent: `${product.price} грн · ${ANIMALS[product.animal_type]}`,
          }),
        ),
      ),
    );
    if (products.length === 0)
      showMessage(message, "Нічого не знайдено.", "info");
  } catch (error) {
    showMessage(message, errorText(error));
  }
}

renderHeader();
document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  loadProducts(document.getElementById("search").value.trim());
});
loadProducts();

const STORAGE_KEY = "todo-app-items";

const form = document.querySelector("#composer");
const input = document.querySelector("#new-todo");
const list = document.querySelector("#list");
const empty = document.querySelector("#empty");
const summary = document.querySelector("#summary");
const clearDone = document.querySelector("#clear-done");
const filters = document.querySelectorAll(".filter");

let items = loadItems();
let filter = "all";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  items.unshift({
    id: crypto.randomUUID(),
    text,
    done: false,
  });
  input.value = "";
  saveAndRender();
  input.focus();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    render();
  });
});

clearDone.addEventListener("click", () => {
  items = items.filter((item) => !item.done);
  saveAndRender();
});

list.addEventListener("click", (event) => {
  const itemEl = event.target.closest(".item");
  if (!itemEl) return;
  const item = items.find((entry) => entry.id === itemEl.dataset.id);
  if (!item) return;

  if (event.target.closest("[data-action='toggle']")) {
    item.done = !item.done;
    saveAndRender();
  }

  if (event.target.closest("[data-action='delete']")) {
    items = items.filter((entry) => entry.id !== item.id);
    saveAndRender();
  }

  if (event.target.closest("[data-action='edit']")) {
    startEdit(itemEl, item);
  }
});

list.addEventListener("dblclick", (event) => {
  const label = event.target.closest(".label");
  if (!label) return;
  const itemEl = label.closest(".item");
  const item = items.find((entry) => entry.id === itemEl.dataset.id);
  if (item) startEdit(itemEl, item);
});

function startEdit(itemEl, item) {
  const label = itemEl.querySelector(".label");
  const editor = document.createElement("input");
  editor.type = "text";
  editor.value = item.text;
  editor.maxLength = 120;
  editor.setAttribute("aria-label", "编辑任务");
  label.replaceWith(editor);
  editor.focus();
  editor.select();

  let closed = false;
  const finish = (save) => {
    if (closed) return;
    closed = true;
    if (save) {
      const text = editor.value.trim();
      if (text) item.text = text;
    }
    saveAndRender();
  };

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  editor.addEventListener("blur", () => finish(true));
}

function render() {
  const visible = items.filter((item) => {
    if (filter === "active") return !item.done;
    if (filter === "done") return item.done;
    return true;
  });

  list.innerHTML = visible.map(itemTemplate).join("");

  const remaining = items.filter((item) => !item.done).length;
  const doneCount = items.length - remaining;
  summary.textContent = items.length
    ? `${remaining} 项未完成，共 ${items.length} 项`
    : "还没有任务";

  clearDone.hidden = doneCount === 0;

  const messages = {
    all: "写下一件今天要完成的事。",
    active: "未完成的任务都处理完了。",
    done: "还没有已完成的任务。",
  };
  empty.hidden = visible.length > 0;
  empty.textContent = items.length ? messages[filter] : messages.all;
}

function itemTemplate(item) {
  return `
    <li class="item${item.done ? " is-done" : ""}" data-id="${item.id}">
      <button class="check" type="button" data-action="toggle" aria-label="${item.done ? "标为未完成" : "标为已完成"}"></button>
      <button class="label" type="button" data-action="edit">${escapeHtml(item.text)}</button>
      <div class="actions">
        <button class="icon-btn danger" type="button" data-action="delete" aria-label="删除">×</button>
      </div>
    </li>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.text === "string" && item.id);
  } catch {
    return [];
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  render();
}

render();

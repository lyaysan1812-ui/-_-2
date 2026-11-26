"use strict";

/*
  СЕМЕЙНЫЙ БЮДЖЕТ

  Технологии:
  HTML + CSS + JavaScript

  Хранение:
  localStorage браузера

  Все расчёты выполняются локально.
*/

const categories = {
  income: [
    "Зарплата",
    "Подработка",
    "Пособия",
    "Подарки",
    "Другие доходы"
  ],

  expense: [
    "Продукты",
    "Жильё",
    "Коммунальные услуги",
    "Транспорт",
    "Здоровье",
    "Образование",
    "Одежда",
    "Дети",
    "Развлечения",
    "Связь и интернет",
    "Прочие расходы"
  ]
};

const STORAGE_OPERATIONS = "family_budget_operations_v1";
const STORAGE_LIMITS = "family_budget_limits_v1";

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);

    if (key === STORAGE_OPERATIONS) {
      return Array.isArray(parsed) ? parsed : fallback;
    }

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    return fallback;
  }
}

let operations = loadData(STORAGE_OPERATIONS, []);
let limits = loadData(STORAGE_LIMITS, {});
let editingId = null;

const monthInput = document.getElementById("month");
const budgetInput = document.getElementById("budget");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const form = document.getElementById("operationForm");
const tableBody = document.getElementById("operationsTable");
const chart = document.getElementById("chart");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function money(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function saveOperations() {
  try {
    localStorage.setItem(STORAGE_OPERATIONS, JSON.stringify(operations));
    return true;
  } catch (error) {
    alert("Не удалось сохранить данные. Проверьте настройки браузера.");
    return false;
  }
}

function saveLimits() {
  try {
    localStorage.setItem(STORAGE_LIMITS, JSON.stringify(limits));
    return true;
  } catch (error) {
    alert("Не удалось сохранить лимит.");
    return false;
  }
}

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function selectedMonth() {
  return monthInput.value;
}

function monthOperations() {
  return operations.filter(
    (item) => item.date.slice(0, 7) === selectedMonth()
  );
}

function getTotals(items) {
  let income = 0;
  let expense = 0;

  items.forEach((item) => {
    const amount = Number(item.amount);

    if (item.type === "income") {
      income += amount;
    } else {
      expense += amount;
    }
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

function updateCategories(selectedCategory = null) {
  const type = typeInput.value;

  categoryInput.replaceChildren();

  const options = [...categories[type]];

  if (selectedCategory && !options.includes(selectedCategory)) {
    options.push(selectedCategory);
  }

  options.forEach((name) => {
    const option = document.createElement("option");

    option.value = name;
    option.textContent = name;
    categoryInput.appendChild(option);
  });

  if (selectedCategory) {
    categoryInput.value = selectedCategory;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Введите положительную сумму.");
    return;
  }

  if (!dateInput.value) {
    alert("Укажите дату.");
    return;
  }

  const operation = {
    id: editingId || generateId(),
    type: typeInput.value,
    category: categoryInput.value,
    amount: Math.round(amount * 100) / 100,
    date: dateInput.value,
    description: descriptionInput.value.trim()
  };

  const previous = [...operations];

  if (editingId) {
    operations = operations.map((item) =>
      item.id === editingId ? operation : item
    );
  } else {
    operations.push(operation);
  }

  if (!saveOperations()) {
    operations = previous;
    return;
  }

  monthInput.value = operation.date.slice(0, 7);

  resetForm();
  render();
});

function editOperation(id) {
  const item = operations.find((operation) => operation.id === id);

  if (!item) {
    return;
  }

  editingId = id;
  typeInput.value = item.type;
  updateCategories(item.category);
  amountInput.value = item.amount;
  dateInput.value = item.date;
  descriptionInput.value = item.description || "";

  document.getElementById("formTitle").textContent = "Редактирование операции";
  document.getElementById("saveButton").textContent = "Сохранить изменения";
  document.getElementById("cancelButton").hidden = false;

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteOperation(id) {
  if (!confirm("Удалить эту операцию?")) {
    return;
  }

  const previous = [...operations];

  operations = operations.filter((item) => item.id !== id);

  if (!saveOperations()) {
    operations = previous;
    return;
  }

  if (editingId === id) {
    resetForm();
  }

  render();
}

function resetForm() {
  form.reset();
  editingId = null;
  typeInput.value = "income";
  updateCategories();
  dateInput.value = localDateString();

  document.getElementById("formTitle").textContent = "Новая операция";
  document.getElementById("saveButton").textContent = "Добавить операцию";
  document.getElementById("cancelButton").hidden = true;
}

function renderSummary(items) {
  const totals = getTotals(items);

  document.getElementById("totalIncome").textContent = money(totals.income);
  document.getElementById("totalExpense").textContent = money(totals.expense);

  const balanceElement = document.getElementById("balance");

  balanceElement.textContent = money(totals.balance);
  balanceElement.classList.toggle("negative", totals.balance < 0);

  renderBudget(totals.expense);
}

function renderBudget(expense) {
  const limit = Number(limits[selectedMonth()]) || 0;
  const remaining = document.getElementById("remaining");
  const info = document.getElementById("budgetInfo");
  const fill = document.getElementById("progressFill");

  if (limit <= 0) {
    remaining.textContent = "—";
    remaining.classList.remove("negative");
    info.textContent = "Установите месячный лимит расходов.";
    fill.style.width = "0%";
    return;
  }

  const difference = limit - expense;
  const percent = (expense / limit) * 100;

  remaining.textContent = money(difference);
  remaining.classList.toggle("negative", difference < 0);

  info.textContent =
    `Использовано ${percent.toFixed(1)}% от лимита ${money(limit)}.`;

  fill.style.width = Math.min(percent, 100) + "%";

  if (percent >= 100) {
    fill.style.background = "#ef4444";
  } else if (percent >= 80) {
    fill.style.background = "#f59e0b";
  } else {
    fill.style.background = "#22c55e";
  }
}

function renderChart(items) {
  chart.replaceChildren();

  const expenses = items.filter((item) => item.type === "expense");

  if (expenses.length === 0) {
    const message = document.createElement("p");

    message.className = "muted";
    message.textContent = "В этом месяце расходов пока нет.";
    chart.appendChild(message);
    return;
  }

  const totals = {};

  expenses.forEach((item) => {
    totals[item.category] =
      (totals[item.category] || 0) + Number(item.amount);
  });

  const totalExpense = Object.values(totals).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([category, amount]) => {
    const percent = (amount / totalExpense) * 100;
    const row = document.createElement("div");

    row.className = "chart-row";

    const label = document.createElement("span");
    label.textContent = category;

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = percent + "%";
    bar.appendChild(fill);

    const value = document.createElement("span");
    value.className = "right";
    value.textContent = `${money(amount)} (${percent.toFixed(1)}%)`;

    row.append(label, bar, value);
    chart.appendChild(row);
  });
}

function renderTable(items) {
  tableBody.replaceChildren();

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.textContent = "Операций за выбранный месяц нет.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((item) => {
    const row = document.createElement("tr");
    const values = [
      item.date.split("-").reverse().join("."),
      item.type === "income" ? "Доход" : "Расход",
      item.category,
      item.description || "—",
      money(item.amount)
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");

      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const editButton = document.createElement("button");

    editButton.className = "secondary";
    editButton.type = "button";
    editButton.textContent = "Изменить";
    editButton.addEventListener("click", () => editOperation(item.id));

    const deleteButton = document.createElement("button");

    deleteButton.className = "danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => deleteOperation(item.id));

    actionCell.append(editButton, deleteButton);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function render() {
  const items = monthOperations();

  renderSummary(items);
  renderChart(items);
  renderTable(items);

  budgetInput.value = limits[selectedMonth()] ?? "";
}

function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r]/.test(text) ? "'" + text : text;

  return '"' + safe.replace(/"/g, '""') + '"';
}

function exportCSV() {
  const items = monthOperations();

  if (items.length === 0) {
    alert("Нет операций для экспорта.");
    return;
  }

  const rows = [["Дата", "Тип", "Категория", "Сумма", "Комментарий"]];

  items.forEach((item) => {
    rows.push([
      item.date,
      item.type === "income" ? "Доход" : "Расход",
      item.category,
      Number(item.amount).toFixed(2).replace(".", ","),
      item.description || ""
    ]);
  });

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `family-budget-${selectedMonth()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function clearMonth() {
  const items = monthOperations();

  if (items.length === 0) {
    alert("За этот месяц операций нет.");
    return;
  }

  const answer = confirm(
    `Удалить ${items.length} операций за ${selectedMonth()}?`
  );

  if (!answer) {
    return;
  }

  const previous = [...operations];

  operations = operations.filter(
    (item) => item.date.slice(0, 7) !== selectedMonth()
  );

  if (!saveOperations()) {
    operations = previous;
    return;
  }

  resetForm();
  render();
}

typeInput.addEventListener("change", () => updateCategories());

monthInput.addEventListener("change", () => {
  render();
});

budgetInput.addEventListener("change", () => {
  const value = budgetInput.value.trim();

  if (value === "") {
    delete limits[selectedMonth()];
  } else {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      alert("Лимит должен быть неотрицательным.");
      budgetInput.value = limits[selectedMonth()] ?? "";
      return;
    }

    limits[selectedMonth()] = number;
  }

  saveLimits();
  render();
});

document.getElementById("cancelButton").addEventListener("click", resetForm);
document.getElementById("exportButton").addEventListener("click", exportCSV);
document.getElementById("clearButton").addEventListener("click", clearMonth);

function initialize() {
  const today = localDateString();

  monthInput.value = today.slice(0, 7);
  dateInput.value = today;
  updateCategories();
  render();
  updateThemeButton();
}

initialize();

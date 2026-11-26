"use strict";

const STORAGE_THEME = "family_budget_theme_v1";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function updateThemeButton() {
  const themeToggle = document.getElementById("themeToggle");

  if (!themeToggle) {
    return;
  }

  const dark = currentTheme() === "dark";

  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute(
    "aria-label",
    dark ? "Включить светлую тему" : "Включить тёмную тему"
  );

  themeToggle.querySelector(".theme-toggle-icon").textContent = dark
    ? "☀️"
    : "🌙";
  themeToggle.querySelector(".theme-toggle-text").textContent = dark
    ? "Светлая"
    : "Тёмная";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    localStorage.setItem(STORAGE_THEME, theme);
  } catch (error) {
    console.error("Не удалось сохранить тему:", error);
  }

  updateThemeButton();
}

function toggleTheme() {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener("click", toggleTheme);
  updateThemeButton();
});

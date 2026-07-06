export const THEMES = {
  default: { label: "Default", themeColor: "#0a0a0a" },
  scifi: { label: "Sci-Fi", themeColor: "#050810" },
};

export const THEME_STORAGE_KEY = "scorekeeper-theme";
export const DEFAULT_THEME = "default";

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored in THEMES ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme) {
  const resolved = theme in THEMES ? theme : DEFAULT_THEME;
  document.documentElement.dataset.theme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEMES[resolved].themeColor);
  }

  return resolved;
}

export function initTheme() {
  return applyTheme(getStoredTheme());
}

export function setTheme(theme) {
  const resolved = applyTheme(theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    /* ignore storage failures */
  }

  return resolved;
}

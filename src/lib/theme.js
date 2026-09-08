// Lightweight theme toggle (collector night mode). Applies a `dark` class on <html>.
const KEY = 'ashoka_theme'

export function initTheme() {
  try {
    if (localStorage.getItem(KEY) === 'dark') document.documentElement.classList.add('dark')
  } catch { /* ignore */ }
}

export function isDark() {
  return document.documentElement.classList.contains('dark')
}

export function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark')
  try { localStorage.setItem(KEY, dark ? 'dark' : 'light') } catch { /* ignore */ }
  return dark
}

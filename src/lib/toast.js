function show(message, type) {
  try { window.dispatchEvent(new CustomEvent('toast', { detail: { message, type, id: Math.random() } })) } catch { /* noop */ }
}
export const toast = {
  success: (m) => show(m, 'success'),
  error: (m) => show(m, 'error'),
  info: (m) => show(m, 'info'),
}

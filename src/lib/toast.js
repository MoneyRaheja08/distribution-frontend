import { haptic } from './haptics.js'
function show(message, type) {
  haptic(type === 'error' ? [8, 40, 8] : 12)
  try { window.dispatchEvent(new CustomEvent('toast', { detail: { message, type, id: Math.random() } })) } catch { /* noop */ }
}
export const toast = {
  success: (m) => show(m, 'success'),
  error: (m) => show(m, 'error'),
  info: (m) => show(m, 'info'),
}

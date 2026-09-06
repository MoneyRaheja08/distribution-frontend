export function haptic(pattern = 12) {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern) } catch { /* noop */ }
}

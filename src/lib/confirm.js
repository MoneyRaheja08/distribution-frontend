let resolver = null
// Promise-based confirm: const ok = await confirmDialog('Delete?', { danger: true })
export function confirmDialog(message, opts = {}) {
  return new Promise((resolve) => {
    resolver = resolve
    try { window.dispatchEvent(new CustomEvent('confirm:open', { detail: { message, ...opts } })) }
    catch { resolve(false) }
  })
}
export function _resolveConfirm(v) { if (resolver) { resolver(v); resolver = null } }

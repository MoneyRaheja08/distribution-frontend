import * as mock from './mock.js'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK) === 'true'

let token = null
export const setToken = (t) => { token = t }

async function http(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail
    try { detail = (await res.json()).detail } catch { /* ignore */ }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return res.json()
}

async function httpForm(path, formData) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  if (!res.ok) {
    let detail
    try { detail = (await res.json()).detail } catch { /* ignore */ }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return res.json()
}

// Each method maps 1:1 to a FastAPI endpoint. Flip VITE_USE_MOCK to switch.
export const api = {
  login: (name, pin) => USE_MOCK ? mock.login(name, pin) : http('/auth/login', { method: 'POST', body: { name, pin } }),

  summary: () => USE_MOCK ? mock.summary() : http('/payments/summary'),

  dealers: () => USE_MOCK ? mock.dealers() : http('/dealers'),
  dealer: (id) => USE_MOCK ? mock.dealer(id) : http('/dealers/' + id),
  saveDealer: (d) => USE_MOCK ? mock.save('dealers', d)
    : http(d.id ? '/dealers/' + d.id : ('/dealers?opening_balance=' + (d.opening_balance || 0)), { method: d.id ? 'PATCH' : 'POST', body: d }),
  dealerLedger: (id) => USE_MOCK ? mock.dealerLedger(id) : http('/dealers/' + id + '/ledger'),
  addBill: (id, bill) => USE_MOCK ? mock.addBill(id, bill) : http('/dealers/' + id + '/bills', { method: 'POST', body: bill }),
  seedDealer: (id, payload) => USE_MOCK ? mock.seedDealer(id, payload) : http('/dealers/' + id + '/seed', { method: 'POST', body: payload }),
  bulkBills: (bills) => USE_MOCK ? mock.bulkBills(bills) : http('/bills/bulk', { method: 'POST', body: { bills } }),
  pendingPayments: () => USE_MOCK ? mock.pendingPayments() : http('/payments/pending'),
  approvePayment: (id, approved) => USE_MOCK ? mock.approvePayment(id, approved) : http('/payments/' + id + '/approve', { method: 'PATCH', body: { approved } }),
  deletePayment: (id) => USE_MOCK ? mock.deletePayment(id) : http('/payments/' + id, { method: 'DELETE' }),
  collections: (reconciled) => USE_MOCK ? mock.collections(reconciled) : http('/payments/collections' + (reconciled === undefined ? '' : '?reconciled=' + reconciled)),
  reconcilePayment: (id, reconciled) => USE_MOCK ? mock.reconcilePayment(id, reconciled) : http('/payments/' + id + '/reconcile', { method: 'PATCH', body: { reconciled } }),
  parseInvoice: (file) => { if (USE_MOCK) return mock.parseInvoice(file); const fd = new FormData(); fd.append('file', file); return httpForm('/invoices/parse', fd) },
  delDealer: (id) => USE_MOCK ? mock.del('dealers', id) : http('/dealers/' + id, { method: 'DELETE' }),

  stock: () => USE_MOCK ? mock.list('stock') : http('/stock'),
  saveStock: (s) => USE_MOCK ? mock.save('stock', s)
    : http(s.id ? '/stock/' + s.id : '/stock', { method: s.id ? 'PATCH' : 'POST', body: s }),
  delStock: (id) => USE_MOCK ? mock.del('stock', id) : http('/stock/' + id, { method: 'DELETE' }),

  users: () => USE_MOCK ? mock.list('users') : http('/users'),
  saveUser: (u) => USE_MOCK ? mock.save('users', u)
    : http(u.id ? '/users/' + u.id : '/users', { method: u.id ? 'PATCH' : 'POST', body: u }),
  delUser: (id) => USE_MOCK ? mock.del('users', id) : http('/users/' + id, { method: 'DELETE' }),

  payments: (query = '') => USE_MOCK ? mock.payments(query) : http('/payments' + query),
  collect: (b) => USE_MOCK ? mock.collect(b) : http('/payments', { method: 'POST', body: b }),
  deposit: (cid) => USE_MOCK ? mock.deposit(cid) : http('/payments/deposit', { method: 'POST', body: { collector_id: cid } }),
  cheque: (id, cleared) => USE_MOCK ? mock.cheque(id, cleared) : http('/payments/' + id + '/cheque', { method: 'PATCH', body: { cleared } }),

  pricelists: () => USE_MOCK ? mock.pricelists() : http('/pricelists'),
  createPricelist: (body) => USE_MOCK ? mock.createPricelist(body) : http('/pricelists', { method: 'POST', body }),
  updatePricelist: (id, body) => USE_MOCK ? mock.updatePricelist(id, body) : http('/pricelists/' + id, { method: 'PATCH', body }),
  deletePricelist: (id) => USE_MOCK ? mock.deletePricelist(id) : http('/pricelists/' + id, { method: 'DELETE' }),
  pricelistProducts: (id) => USE_MOCK ? mock.pricelistProducts(id) : http('/pricelists/' + id + '/products'),
  importPricelist: (id, products) => USE_MOCK ? mock.importPricelist(id, products) : http('/pricelists/' + id + '/products/bulk', { method: 'POST', body: { products } }),
  selectableUsers: () => USE_MOCK ? mock.selectableUsers() : http('/users/selectable'),
}

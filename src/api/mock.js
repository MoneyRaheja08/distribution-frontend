// In-memory mock backend so the UI runs with no server (VITE_USE_MOCK=true).
// Mirrors the FastAPI shapes exactly. Delete or ignore once you run for real.
import { outstanding, AGE } from '../lib/format.js'

const AGE_OLDEST = ['age_90p', 'age_61_90', 'age_31_60', 'age_0_30']
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 200))
const nid = (p) => p + Math.random().toString(36).slice(2, 6)

const store = {
  receipt: 1024,
  users: [
    { id: 'ua', name: 'Money', role: 'admin', pin: '1234', price_list_access: true },
    { id: 'um', name: 'Rakesh', role: 'manager', pin: '1111', price_list_access: true },
    { id: 'u1', name: 'Gurpreet Singh', role: 'collector', pin: '1111' },
    { id: 'u2', name: 'Harjinder Kaur', role: 'collector', pin: '1111' },
    { id: 'u3', name: 'Vikas Kumar', role: 'collector', pin: '1111' },
  ],
  dealers: [
    { id: 'd1', name: 'Sharma Electronics', area: 'Sector 22, Chandigarh', phone: '9814000000', credit_limit: 300000, collector_id: 'u1', ageing: { age_0_30: 98000, age_31_60: 76000, age_61_90: 65500, age_90p: 45000 } },
    { id: 'd2', name: 'Bansal Home Appliances', area: 'Phase 5, Mohali', phone: '9915000000', credit_limit: 200000, collector_id: 'u2', ageing: { age_0_30: 98000, age_31_60: 14000, age_61_90: 0, age_90p: 0 } },
    { id: 'd3', name: 'Guru Nanak Traders', area: 'Sector 35, Chandigarh', phone: '9872000000', credit_limit: 400000, collector_id: 'u1', ageing: { age_0_30: 60000, age_31_60: 110000, age_61_90: 190000, age_90p: 50000 } },
    { id: 'd4', name: 'New Anand Radios', area: 'Zirakpur', phone: '6283000000', credit_limit: 120000, collector_id: 'u3', ageing: { age_0_30: 0, age_31_60: 67800, age_61_90: 0, age_90p: 0 } },
  ],
  stock: [
    { id: 's1', name: 'Haier 1.5T 3★ Split AC (HSU-18)', price: 32500, qty: 42 },
    { id: 's2', name: 'Haier 265L Frost-Free Fridge', price: 22800, qty: 18 },
    { id: 's3', name: 'Haier 8kg Front-Load Washer', price: 27400, qty: 6 },
    { id: 's4', name: 'Haier 55" 4K Google TV', price: 34900, qty: 11 },
    { id: 's5', name: 'Haier 25L Storage Water Heater', price: 9200, qty: 0 },
  ],
  payments: [
    { id: 'p2', dealer_id: 'd3', dealer_name: 'Guru Nanak Traders', collector_id: 'u1', collector_name: 'Gurpreet Singh', amount: 25000, mode: 'UPI', date: 'today', receipt: 1018, status: 'cleared', deposited: true },
    { id: 'p3', dealer_id: 'd2', dealer_name: 'Bansal Home Appliances', collector_id: 'u2', collector_name: 'Harjinder Kaur', amount: 186000, mode: 'Cheque', cheque: '004521 · PNB', date: 'today', receipt: 1019, status: 'pending', deposited: false, alloc: { age_0_30: 98000, age_31_60: 88000 } },
    { id: 'p4', dealer_id: 'd4', dealer_name: 'New Anand Radios', collector_id: 'u3', collector_name: 'Vikas Kumar', amount: 52000, mode: 'Cash', date: 'today', receipt: 1020, status: 'cleared', deposited: false, alloc: { age_31_60: 52000 } },
    { id: 'p5', dealer_id: 'd1', dealer_name: 'Sharma Electronics', collector_id: 'u1', collector_name: 'Gurpreet Singh', amount: 154000, mode: 'Cheque', cheque: '771230 · HDFC', date: 'today', receipt: 1021, status: 'pending', deposited: false, alloc: { age_31_60: 76000, age_0_30: 78000 } },
  ],
}

const withOut = (d) => ({ ...d, outstanding: outstanding(d) })

export const login = (name, pin) => {
  const u = store.users.find((x) => x.name === name && x.pin === pin)
  return u ? wait({ access_token: 'mock-token', user: { id: u.id, name: u.name, role: u.role, price_list_access: !!u.price_list_access } })
    : Promise.reject(new Error('Wrong name or PIN'))
}
export const list = (k) => wait(store[k].map((x) => ({ ...x })))
export const dealers = () => wait(store.dealers.map(withOut))
export const dealer = (id) => wait(withOut(store.dealers.find((d) => d.id === id)))
export const save = (k, item) => {
  if (item.id) { const i = store[k].findIndex((x) => x.id === item.id); store[k][i] = { ...store[k][i], ...item } }
  else store[k].push({ ...item, id: nid(k[0]) })
  return wait({ ok: true })
}
export const del = (k, id) => { store[k] = store[k].filter((x) => x.id !== id); return wait({ ok: true }) }
export const payments = (query = '') => {
  const m = /dealer_id=([^&]+)/.exec(query)
  const items = m ? store.payments.filter((p) => p.dealer_id === m[1]) : store.payments
  return wait([...items].reverse())
}
export const collect = ({ dealer_id, amount, mode, cheque }) => {
  const d = store.dealers.find((x) => x.id === dealer_id)
  let rem = amount; const alloc = {}
  for (const f of AGE_OLDEST) { const t = Math.min(rem, d.ageing[f]); if (t > 0) { alloc[f] = t; d.ageing[f] -= t; rem -= t } }
  store.receipt += 1
  const p = { id: nid('p'), dealer_id, dealer_name: d.name, collector_id: store._me, collector_name: store._meName, amount, mode, cheque, date: 'today', receipt: store.receipt, status: mode === 'Cheque' ? 'pending' : 'cleared', deposited: false, alloc }
  store.payments.push(p)
  return wait({ ...p, new_outstanding: outstanding(d) })
}
export const deposit = (cid) => { store.payments.forEach((p) => { if (p.collector_id === cid && p.mode === 'Cash' && p.status === 'cleared') p.deposited = true }); return wait({ ok: true }) }
export const cheque = (id, cleared) => {
  const p = store.payments.find((x) => x.id === id)
  if (cleared) p.status = 'cleared'
  else { p.status = 'bounced'; const d = store.dealers.find((x) => x.id === p.dealer_id); if (d) Object.entries(p.alloc || {}).forEach(([f, v]) => { d.ageing[f] += v }) }
  return wait({ ok: true })
}
export const summary = () => {
  const total = store.dealers.reduce((s, d) => s + outstanding(d), 0)
  const over90 = store.dealers.reduce((s, d) => s + (d.ageing.age_90p || 0), 0)
  const collected = store.payments.filter((p) => p.date === 'today' && p.status !== 'bounced').reduce((s, p) => s + p.amount, 0)
  const cash = store.payments.filter((p) => p.mode === 'Cash' && !p.deposited && p.status === 'cleared').reduce((s, p) => s + p.amount, 0)
  const chq = store.payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const per = store.users.filter((u) => u.role === 'collector').map((u) => ({
    id: u.id, name: u.name,
    dealers: store.dealers.filter((d) => d.collector_id === u.id).length,
    collected_today: store.payments.filter((p) => p.collector_id === u.id && p.date === 'today' && p.status !== 'bounced').reduce((s, p) => s + p.amount, 0),
  }))
  return wait({ total_outstanding: total, over_90_days: over90, collected_today: collected, cash_undeposited: cash, cheques_pending: chq, per_collector: per })
}
// remember who is logged in (mock only) so collections attribute correctly
export const _setMe = (id, name, role) => { store._me = id; store._meName = name; store._meRole = role }

// ---- price lists (mock) ----
store.pricelists = [
  { id: 'pl1', name: 'Haier — Aug 2026', allowed_user_ids: ['u1', 'u2'] },
]
store.plproducts = {
  pl1: [
    { id: 'x1', category: 'Air Conditioners', model: 'HSU-18 1.5T 3\u2605', description: '', mrp: 45000, dp: 32500, nlc: 26000 },
    { id: 'x2', category: 'Refrigerators', model: 'HRD-2061 265L', description: '185', mrp: 22800, dp: 19400, nlc: 12125 },
    { id: 'x3', category: 'Televisions', model: 'H55K85GUX 55" 4K', description: 'UHD Google TV', mrp: 73990, dp: 68590, nlc: 40170 },
  ],
}
const _canSee = (pl) => store._meRole === 'admin' || (pl.allowed_user_ids || []).includes(store._me)
export const pricelists = () => wait(
  store.pricelists.filter(_canSee).map((pl) => ({ ...pl, count: (store.plproducts[pl.id] || []).length }))
)
export const createPricelist = (body) => {
  const id = 'pl' + Date.now()
  store.pricelists.push({ id, name: body.name, allowed_user_ids: body.allowed_user_ids || [] })
  store.plproducts[id] = []
  return wait({ id, name: body.name, allowed_user_ids: body.allowed_user_ids || [], count: 0 })
}
export const updatePricelist = (id, body) => {
  const pl = store.pricelists.find((p) => p.id === id)
  if (pl) { if (body.name != null) pl.name = body.name; if (body.allowed_user_ids != null) pl.allowed_user_ids = body.allowed_user_ids }
  return wait({ ...pl, count: (store.plproducts[id] || []).length })
}
export const deletePricelist = (id) => {
  store.pricelists = store.pricelists.filter((p) => p.id !== id); delete store.plproducts[id]
  return wait({ ok: true })
}
export const pricelistProducts = (id) => wait((store.plproducts[id] || []).map((x) => ({ ...x })))
export const importPricelist = (id, products) => {
  store.plproducts[id] = products.map((p, i) => ({ ...p, id: 'x' + i }))
  return wait({ ok: true, count: products.length })
}
export const selectableUsers = () => wait(store.users.filter((u) => u.role !== 'admin').map((u) => ({ id: u.id, name: u.name, role: u.role })))

// ---- ledger / bills (mock stubs) ----
export const dealerLedger = (id) => {
  const d = store.dealers.find((x) => x.id === id) || { name: 'Dealer' }
  return wait({ dealer: d.name, outstanding: outstanding(d), last_payment: null, entries: [] })
}
export const addBill = (id, bill) => {
  const d = store.dealers.find((x) => x.id === id)
  if (d) d.ageing.age_0_30 = (d.ageing.age_0_30 || 0) + (bill.amount || 0)
  return wait({ ok: true })
}
export const seedDealer = (id, payload) => wait({ ok: true })
export const bulkBills = (bills) => wait({ ok: true, added: bills.length, unmatched: [] })
export const parseInvoice = () => wait({ bill_no: 'H00001', date: '2026-09-04', amount: 125628, party: 'KHANNA ENTERPRISES' })

export const pendingPayments = () => wait([])
export const approvePayment = () => wait({ ok: true })

export const deletePayment = () => wait({ ok: true })

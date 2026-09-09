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
  const ageing = { age_0_30: 0, age_31_60: 0, age_61_90: 0, age_90p: 0 }
  store.dealers.forEach((d) => AGE.forEach((f) => { ageing[f] += (d.ageing?.[f] || 0) }))
  const top_overdue = store.dealers
    .map((d) => ({ name: d.name, area: d.area, outstanding: outstanding(d),
      oldest_due: d.ageing.age_90p > 0 ? 95 : d.ageing.age_61_90 > 0 ? 75 : d.ageing.age_31_60 > 0 ? 45 : 20 }))
    .filter((d) => d.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 8)
  const demo = [0, 0, 34000, 0, 68000, 0, 25000, 110000, 0, 52000, 90000, 0, 47000, collected]
  const daily = []
  for (let i = 13; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); daily.push({ date: dt.toLocaleDateString('en-CA'), amount: demo[13 - i] || 0 }) }
  return wait({ total_outstanding: total, over_90_days: over90, collected_today: collected, cash_undeposited: cash, cheques_pending: chq, per_collector: per, ageing, top_overdue, daily, pending_approvals: 0 })
}
// remember who is logged in (mock only) so collections attribute correctly
export const _setMe = (id, name, role) => { store._me = id; store._meName = name; store._meRole = role }

// ---- price lists (mock) ----
store.pricelists = [
  { id: 'pl1', name: 'Haier — Aug 2026', allowed_user_ids: ['u1', 'u2'], columns: ['Category', 'Model', 'MRP', 'DP', 'NLC'], model_col: 'Model', price_col: 'DP' },
]
store.plproducts = {
  pl1: [
    { id: 'x1', cells: { Category: 'Air Conditioners', Model: 'HSU-18 1.5T', MRP: 45000, DP: 32500, NLC: 26000 } },
    { id: 'x2', cells: { Category: 'Refrigerators', Model: 'HRD-2061 265L', MRP: 22800, DP: 19400, NLC: 12125 } },
  ],
}
const _canSee = (pl) => store._meRole === 'admin' || (pl.allowed_user_ids || []).includes(store._me)
export const pricelists = () => wait(
  store.pricelists.filter(_canSee).map((pl) => ({ ...pl, count: (store.plproducts[pl.id] || []).length }))
)
export const createPricelist = (body) => {
  const id = 'pl' + Date.now()
  store.pricelists.push({ id, name: body.name, allowed_user_ids: body.allowed_user_ids || [], columns: ['Category', 'Model', 'MRP', 'DP', 'NLC'], model_col: 'Model', price_col: 'DP' })
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
export const importSalePreview = () => wait({ brand: 'HAIER', bills: [
  { bill_no: 'H00001', date: '2026-04-09', party: 'KHANNA ENTERPRISES', total: 125628, lines: 8, units: 8, matched: true, dealer: 'KHANNA ENTERPRISES', duplicate: false },
  { bill_no: 'H00002', date: '2026-04-09', party: 'ANAND SALES MOHALI', total: 33905, lines: 3, units: 3, matched: false, dealer: null, duplicate: false },
], summary: { total_bills: 2, matched: 1, unmatched: 1, duplicates: 0, matched_total: 125628, total_units: 11, total_lines: 11, unknown_serials: 2, unknown_sample: ['ZZUNK111', 'ZZUNK222'] } })
export const importSaleCommit = () => wait({ ok: true, bills_added: 1, skipped_unmatched: 1, skipped_duplicates: 0, units_sold: 11, qty_sold: 0, sales_lines: 11 })
export const importPurchasePreview = () => wait({ brand: 'HAIER', supplier: 'M/S HAIER APPLIENCES INDIA PVT', summary: { lines: 263, imei_units: 263, qty_only: 0, total: 4210000, duplicates: 0, date_from: '2026-08-30', date_to: '2026-08-30' }, categories: [
  { group: 'HAIER W/M SEMI', qty: 120, amount: 2100000 }, { group: 'HAIER MICROWAVE', qty: 80, amount: 1120000 }, { group: 'HAIER AIR FRYER', qty: 63, amount: 990000 },
] })
export const importPurchaseCommit = () => wait({ ok: true, units_added: 263, qty_added: 0, duplicates: 0, purchase_lines: 263 })
export const catalogUnits = (params = '') => {
  const p = new URLSearchParams((params || '').replace(/^\?/, ''))
  const all = [
    { imei: 'CAACKL0000104S8DTBQ2', brand: 'HAIER', group: 'HAIER W/M SEMI', model: 'HAIER SEMI W/M- HTW80-196BR:NOIDA', status: 'in_stock', purchase_bill: '5056153425', purchase_date: '2026-08-30' },
    { imei: 'FZ03WUM0300GZS2F0257', brand: 'HAIER', group: 'HAIER MICROWAVE', model: 'HAIER M/W- HIL2801DBSJ:MWO', status: 'sold', sale_bill: 'H00002', sale_dealer_name: 'ANAND SALES MOHALI', sale_date: '2026-04-09' },
    { imei: 'RZ8N90ABCDXYZ12345', brand: 'SAMSUNG', group: 'SAMSUNG LED', model: 'SAMSUNG LED- UA43T5770', status: 'in_stock', purchase_bill: 'SP-2201', purchase_date: '2026-06-15' },
  ]
  let r = all
  if (p.get('brand')) r = r.filter((u) => u.brand === p.get('brand'))
  if (p.get('status')) r = r.filter((u) => u.status === p.get('status'))
  const q = (p.get('q') || '').toLowerCase()
  if (q) r = r.filter((u) => (u.model || '').toLowerCase().includes(q) || (u.imei || '').toLowerCase().includes(q))
  return wait(r)
}
export const imeiLookup = (imei) => wait({ imei: (imei || '').trim() || 'FZ03WUM0300GZS2F0257', brand: 'HAIER', group: 'HAIER MICROWAVE', model: 'HAIER M/W- HIL2801DBSJ:MWO', status: 'sold', purchase_bill: '5056153422', purchase_date: '2026-08-30', supplier: 'M/S HAIER APPLIENCES INDIA PVT', sale_bill: 'H00002', sale_dealer_name: 'ANAND SALES MOHALI', sale_date: '2026-04-09', sale_rate: 14209 })
export const reportSales = (from, to) => wait({ from, to, total: 159533, units: 11, count: 11, rows: [
  { date: '2026-04-09', bill_no: 'H00001', dealer: 'KHANNA ENTERPRISES', brand: 'HAIER', group: 'HAIER LED', model: 'HAIER LED- 32" LE32A7-N:HIL', imei: 'td005069009vgs8kxdxx', qty: 1, rate: 14209, amount: 14209 },
  { date: '2026-04-09', bill_no: 'H00002', dealer: 'ANAND SALES MOHALI', brand: 'HAIER', group: 'HAIER MICROWAVE', model: 'HAIER M/W- HIL2801DBSJ:MWO', imei: 'FZ03WUM0300GZS2F0257', qty: 1, rate: 11302, amount: 11302 },
], by_dealer: [{ dealer: 'KHANNA ENTERPRISES', amount: 125628, qty: 8 }, { dealer: 'ANAND SALES MOHALI', amount: 33905, qty: 3 }], by_model: [{ model: 'HAIER LED- 32" LE32A7-N:HIL', brand: 'HAIER', qty: 5, amount: 71045 }, { model: 'HAIER SEMI W/M- HTW80-196BR:NOIDA', brand: 'HAIER', qty: 3, amount: 54582 }, { model: 'HAIER M/W- HIL2801DBSJ:MWO', brand: 'HAIER', qty: 3, amount: 33906 }] })
export const reportPurchasesBrand = (from, to, brand) => {
  const data = {
    HAIER: { amount: 4210000, qty: 263, months: [{ month: '2026-08', amount: 4210000, qty: 263 }], cats: [{ group: 'HAIER W/M SEMI', amount: 2100000, qty: 120 }, { group: 'HAIER MICROWAVE', amount: 1120000, qty: 80 }, { group: 'HAIER AIR FRYER', amount: 990000, qty: 63 }] },
    SAMSUNG: { amount: 1200000, qty: 40, months: [{ month: '2026-07', amount: 1200000, qty: 40 }], cats: [{ group: 'SAMSUNG LED', amount: 800000, qty: 25 }, { group: 'SAMSUNG REF', amount: 400000, qty: 15 }] },
  }
  const keys = brand ? [brand] : Object.keys(data)
  const by_brand = keys.map((k) => ({ brand: k, amount: data[k].amount, qty: data[k].qty }))
  const mAgg = {}, cAgg = {}
  keys.forEach((k) => {
    data[k].months.forEach((m) => { const x = mAgg[m.month] || { amount: 0, qty: 0 }; x.amount += m.amount; x.qty += m.qty; mAgg[m.month] = x })
    data[k].cats.forEach((c) => { const x = cAgg[c.group] || { amount: 0, qty: 0 }; x.amount += c.amount; x.qty += c.qty; cAgg[c.group] = x })
  })
  return wait({ from, to, total: by_brand.reduce((a, b) => a + b.amount, 0), by_brand,
    by_month: Object.entries(mAgg).map(([month, v]) => ({ month, amount: v.amount, qty: v.qty })).sort((a, b) => a.month < b.month ? -1 : 1),
    by_category: Object.entries(cAgg).map(([group, v]) => ({ group, amount: v.amount, qty: v.qty })).sort((a, b) => b.amount - a.amount) })
}
export const reportProfit = (from, to, brand) => {
  const rows = [
    { model: 'HAIER LED- 32" LE32A7-N:HIL', brand: 'HAIER', qty: 5, sale: 71045, cost: 61000, margin: 10045 },
    { model: 'HAIER M/W- HIL2801DBSJ:MWO', brand: 'HAIER', qty: 3, sale: 33906, cost: 29400, margin: 4506 },
    { model: 'SAMSUNG LED- UA43T5770', brand: 'SAMSUNG', qty: 2, sale: 58000, cost: 50000, margin: 8000 },
  ].filter((r) => !brand || r.brand === brand)
  const s = (k) => rows.reduce((a, x) => a + x[k], 0)
  return wait({ from, to, units: rows.reduce((a, x) => a + x.qty, 0), total_sale: s('sale'), total_cost: s('cost'), total_margin: s('margin'), rows,
    by_month: [{ month: '2026-06', sale: 71045, cost: 61000, margin: 10045 }, { month: '2026-07', sale: 58000, cost: 50000, margin: 8000 }, { month: '2026-08', sale: 33906, cost: 29400, margin: 4506 }] })
}
export const agingStock = (days = 60) => wait({ days, count: 2, value: 26500, rows: [  { imei: 'CAACKL0000104S8DTBQ2', model: 'HAIER SEMI W/M- HTW80-196BR:NOIDA', brand: 'HAIER', purchase_date: '2026-03-01', days: 96, purchase_rate: 13500 },
  { imei: 'RZ8N90ABCDXYZ12345', model: 'SAMSUNG LED- UA43T5770', brand: 'SAMSUNG', purchase_date: '2026-04-02', days: 64, purchase_rate: 13000 },
] })
export const reportBrandScorecard = (from, to) => wait({ from, to, rows: [
  { brand: 'HAIER', purchase_amount: 4210000, purchase_qty: 263, sale_amount: 159533, sale_units: 11, stock_value: 238000, stock_units: 16, margin: 22551 },
  { brand: 'SAMSUNG', purchase_amount: 1200000, purchase_qty: 40, sale_amount: 58000, sale_units: 2, stock_value: 205000, stock_units: 10, margin: 8000 },
] })
export const stockSummary = () => wait({ brands: ['HAIER', 'SAMSUNG'], rows: [
  { model: 'HAIER SEMI W/M- HTW80-196BR:NOIDA', brand: 'HAIER', group: 'HAIER W/M SEMI', total: 12, available: 9, tracked: 'imei' },
  { model: 'HAIER M/W- HIL2801DBSJ:MWO', brand: 'HAIER', group: 'HAIER MICROWAVE', total: 8, available: 5, tracked: 'imei' },
  { model: 'HAIER LED- H43S80GFX', brand: 'HAIER', group: 'HAIER LED', total: 6, available: 2, tracked: 'imei' },
  { model: 'SAMSUNG LED- UA43T5770', brand: 'SAMSUNG', group: 'SAMSUNG LED', total: 10, available: 7, tracked: 'imei' },
  { model: 'SAMSUNG REF- RT28', brand: 'SAMSUNG', group: 'SAMSUNG REF', total: 5, available: 3, tracked: 'imei' },
], valuation: [{ brand: 'HAIER', units: 16, value: 238000 }, { brand: 'SAMSUNG', units: 10, value: 205000 }], total_value: 443000 })

export const pendingPayments = () => wait([])
export const approvePayment = () => wait({ ok: true })

export const deletePayment = () => wait({ ok: true })

export const collections = () => wait([])
export const reconcilePayment = () => wait({ ok: true })

export const markVisited = () => wait({ ok: true })
export const visitsToday = () => wait([])

export const reportCollections = () => wait({ total: 0, by_mode: {}, by_collector: [] })
export const reportAgeing = () => wait({ total_outstanding: 0, ageing: {}, top_overdue: [], over_limit: [] })
export const reportActivity = () => wait({ rows: [] })

export const reportSalesVsColl = () => wait({ rows: [], total_sales: 0, total_collected: 0 })

export const reportBillAgeing = () => wait({ dealers: [] })
export const reportBills = (from, to, source) => wait({ from, to, source, total: 250628, rows: [
  { dealer: 'KHANNA ENTERPRISES', bill_no: 'H00001', date: from, amount: 125628, source: 'pdf' },
  { dealer: 'Sharma Electronics', bill_no: 'H00042', date: to, amount: 125000, source: 'pdf' },
] })

export const backup = () => wait({ dealers: [], bills: [], payments: [] })

store.companies = [{ id: 'c1', name: 'Ashoka Sales' }, { id: 'c2', name: 'Ashoka Enterprises' }]
export const companies = () => wait(store.companies.map((c) => ({ ...c })))
export const createCompany = (name) => { const c = { id: 'c' + Date.now(), name }; store.companies.push(c); return wait(c) }
export const renameCompany = (id, name) => { const c = store.companies.find((x) => x.id === id); if (c) c.name = name; return wait(c) }

store.orders = []
export const orders = () => wait(store.orders.map((o) => ({ ...o })))
export const createOrder = (b) => { const o = { ...b, id: 'o' + Date.now(), status: 'pending', total: b.items.reduce((s, i) => s + i.dp * i.qty, 0), created_by: 'You', date: 'today' }; store.orders.unshift(o); return wait(o) }
export const executeOrder = (id, bill_no) => { const o = store.orders.find((x) => x.id === id); if (o) { o.status = 'executed'; o.bill_no = bill_no } return wait({ ok: true }) }
export const deleteOrder = (id) => { store.orders = store.orders.filter((x) => x.id !== id); return wait({ ok: true }) }

export const importFlexible = (plid, payload) => { const pl = store.pricelists.find((x) => x.id === plid); if (pl) { pl.columns = payload.columns; pl.model_col = payload.model_col; pl.price_col = payload.price_col } store.plproducts[plid] = payload.rows.map((r, i) => ({ id: 'x' + i, cells: r })); return wait({ ok: true, count: payload.rows.length }) }
export const deleteColumn = (plid, col) => { const pl = store.pricelists.find((x) => x.id === plid); if (pl) pl.columns = pl.columns.filter((c) => c !== col); (store.plproducts[plid] || []).forEach((pp) => { delete pp.cells[col] }); return wait({ ok: true }) }
export const addProduct = (plid, cells) => { const p = { id: 'x' + Date.now(), cells }; (store.plproducts[plid] = store.plproducts[plid] || []).push(p); return wait(p) }
export const updateProduct = (plid, pid, cells) => { const arr = store.plproducts[plid] || []; const i = arr.findIndex((x) => x.id === pid); if (i > -1) arr[i] = { ...arr[i], cells }; return wait(arr[i]) }
export const deleteProduct = (plid, pid) => { store.plproducts[plid] = (store.plproducts[plid] || []).filter((x) => x.id !== pid); return wait({ ok: true }) }

export const me = () => wait({ user: store.users.find((u) => u.id === store._me) || null })

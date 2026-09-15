import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Minus, Check } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, SectionH, Modal, Field, Select, Pill } from '../../components/ui.jsx'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { useAuth } from '../../auth/AuthContext.jsx'

const norm = (m) => (m || '').trim().toLowerCase()

export default function Orders() {
  const { auth } = useAuth()
  const staff = auth.user.role === 'admin' || auth.user.role === 'manager'
  const [tab, setTab] = useState('pending')
  const [orders, setOrders] = useState(null)
  const [building, setBuilding] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = () => { setOrders(null); api.orders(tab).then(setOrders) }
  useEffect(() => { load() }, [tab])

  if (building) return <NewOrder onClose={() => setBuilding(false)} onDone={() => { setBuilding(false); setTab('pending'); load() }} />

  return (
    <>
      <SectionH onAdd={() => setBuilding(true)}>Orders</SectionH>
      <div className="flex gap-2 mb-3 bg-slate-200 p-1 rounded-xl max-w-xs">
        {[['pending', 'Pending'], ['executed', 'Executed']].map(([k, l]) => (
          <button key={k} data-testid={'orders-tab-' + k} onClick={() => setTab(k)}
            className={'flex-1 py-2 rounded-lg text-[13px] font-semibold ' + (tab === k ? 'bg-white text-slate-900 shadow' : 'text-slate-500')}>{l}</button>
        ))}
      </div>

      {!orders ? <Spin /> : orders.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          {tab === 'pending' ? 'No pending orders. Tap “+ Add”.' : 'No executed orders yet.'}
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {orders.map((o) => {
            const owed = (o.items || []).reduce((s, i) => s + (i.billed_value || 0), 0)
            return (
              <button key={o.id} data-testid={'order-card-' + o.id} onClick={() => setDetail(o)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold truncate">{o.dealer_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{o.items.length} items · by {o.created_by} · {o.date}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {o.status === 'executed'
                        ? <Pill tone="ok">Executed{o.bill_no ? ' · ' + o.bill_no : ''}</Pill>
                        : <Pill tone="over">Pending</Pill>}
                      {!o.pricelist_name && <Pill tone="muted">From stock</Pill>}
                      {owed > 0 && <Pill tone="warn">Owes {inr(owed)}</Pill>}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold shrink-0">{o.total > 0 ? inr(o.total) : o.items.reduce((s, i) => s + i.qty, 0) + ' pcs'}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {detail && <OrderDetail order={detail} staff={staff} onClose={() => setDetail(null)} onChanged={() => { setDetail(null); load() }} />}
    </>
  )
}

function OrderDetail({ order, staff, onClose, onChanged }) {
  const [billNo, setBillNo] = useState('')
  const [busy, setBusy] = useState(false)
  const owed = (order.items || []).reduce((s, i) => s + (i.billed_value || 0), 0)
  const execute = async () => {
    setBusy(true)
    try { await api.executeOrder(order.id, billNo.trim()); toast.success('Order executed'); onChanged() }
    catch (e) { toast.error(e.message); setBusy(false) }
  }
  const del = async () => {
    if (await confirmDialog('Delete this order?', { danger: true, confirmLabel: 'Delete' })) { await api.deleteOrder(order.id); toast.success('Order deleted'); onChanged() }
  }
  return (
    <Modal title={order.dealer_name} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-2">{order.pricelist_name || 'From stock (no price list)'} · by {order.created_by} · {order.date}</div>

      {owed > 0 && (
        <div data-testid="order-owed-banner" className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          This dealer was already billed for these models earlier — <b>{inr(owed)}</b> worth. Collect before delivering fresh stock.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between items-start px-3 py-2 border-b border-slate-50 last:border-0 text-[13px]">
            <div className="min-w-0 pr-2">
              <div className="font-semibold text-slate-800 truncate">{it.model}</div>
              <div className="text-[11px] text-slate-500">{it.qty} {it.dp ? '× ' + inr(it.dp) : 'pcs'}</div>
              {it.billed_value > 0 && (
                <div className="text-[11px] text-amber-700 mt-0.5">Already billed: {it.billed_units || 0} · {inr(it.billed_value)}</div>
              )}
            </div>
            <div className="font-bold text-slate-900 shrink-0">{it.dp ? inr(it.dp * it.qty) : it.qty + ' pcs'}</div>
          </div>
        ))}
        <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 text-[14px] font-bold">
          <span>Total</span><span>{order.total > 0 ? inr(order.total) : order.items.reduce((s, i) => s + i.qty, 0) + ' pcs'}</span>
        </div>
      </div>
      {order.note && <div className="text-[12px] text-slate-500 mb-3">Note: {order.note}</div>}

      {order.status === 'executed' ? (
        <div className="text-[13px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          Executed by {order.executed_by}{order.bill_no ? ' · Bill ' + order.bill_no : ''}{order.executed_at ? ' · ' + order.executed_at : ''}
        </div>
      ) : staff ? (
        <>
          <Field label="Bill number (from your invoice)" value={billNo} onChange={setBillNo} />
          <button data-testid="order-execute-btn" onClick={execute} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? '…' : <><Check size={16} />Mark executed</>}
          </button>
          <button data-testid="order-delete-btn" onClick={del} className="w-full mt-2 border border-red-200 text-red-700 font-semibold py-2.5 rounded-xl text-[13px]">Delete order</button>
        </>
      ) : (
        <div className="text-[12px] text-slate-500">Waiting for a manager to execute this order.</div>
      )}
    </Modal>
  )
}

function NewOrder({ onClose, onDone }) {
  const [dealers, setDealers] = useState([])
  const [lists, setLists] = useState([])
  const [dealerId, setDealerId] = useState('')
  const [source, setSource] = useState('stock')      // 'stock' or a price-list id
  const [dealerData, setDealerData] = useState(null)  // { stock:[], billed:{} }
  const [plProducts, setPlProducts] = useState([])
  const [q, setQ] = useState('')
  const [cart, setCart] = useState({})   // model -> {model, brand, dp, qty, billed_units, billed_value}
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.dealers().then(setDealers); api.pricelists().then(setLists) }, [])

  // Load this dealer's stock models + billed history
  useEffect(() => {
    setDealerData(null); setCart({})
    if (!dealerId) return
    api.orderDealerModels(dealerId).then(setDealerData).catch((e) => toast.error(e.message))
  }, [dealerId])

  // Load price-list products when a price list is the chosen source
  useEffect(() => {
    if (source === 'stock') { setPlProducts([]); return }
    const pl = lists.find((l) => l.id === source)
    const mc = pl?.model_col || 'Model', pc = pl?.price_col || 'DP'
    api.pricelistProducts(source).then((ps) => setPlProducts(
      ps.map((p) => ({ id: p.id, model: String(p.cells?.[mc] ?? ''), dp: Number(p.cells?.[pc]) || 0 })).filter((p) => p.model)
    ))
  }, [source, lists])

  const billed = dealerData?.billed || {}

  const products = useMemo(() => {
    if (source === 'stock') {
      return (dealerData?.stock || []).map((s) => ({ id: norm(s.model), model: s.model, brand: s.brand, dp: 0, available: s.available }))
    }
    return plProducts
  }, [source, dealerData, plProducts])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    return products.filter((p) => !n || p.model.toLowerCase().includes(n)).slice(0, 80)
  }, [products, q])

  const items = Object.values(cart)
  const total = items.reduce((s, i) => s + (i.dp || 0) * i.qty, 0)
  const owed = items.reduce((s, i) => s + (i.billed_value || 0), 0)

  const add = (p) => setCart((c) => {
    const b = billed[norm(p.model)]
    const prev = c[norm(p.model)]
    return { ...c, [norm(p.model)]: {
      model: p.model, brand: p.brand || (b?.brand ?? ''), dp: p.dp || 0, qty: (prev?.qty || 0) + 1,
      billed_units: b?.units || 0, billed_value: b?.value || 0,
    } }
  })
  const dec = (key) => setCart((c) => { const it = c[key]; if (!it) return c; const qty = it.qty - 1; const n = { ...c }; if (qty <= 0) delete n[key]; else n[key] = { ...it, qty }; return n })

  const save = async () => {
    if (!dealerId) return toast.error('Pick a dealer')
    if (items.length === 0) return toast.error('Add at least one item')
    setBusy(true)
    try {
      const pl = lists.find((l) => l.id === source)
      await api.createOrder({
        dealer_id: dealerId, pricelist_name: pl?.name || '', note,
        items: items.map((i) => ({ model: i.model, brand: i.brand, dp: i.dp, qty: i.qty, billed_units: i.billed_units, billed_value: i.billed_value })),
      })
      toast.success('Order saved'); onDone()
    } catch (e) { toast.error(e.message); setBusy(false) }
  }

  return (
    <>
      <button onClick={onClose} data-testid="new-order-back" className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">‹ Orders</button>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">New order</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <Select label="Dealer" value={dealerId} onChange={setDealerId} testid="new-order-dealer"
          options={[['', '— pick dealer —'], ...dealers.map((d) => [d.id, d.name])]} />
        <Select label="Price source" value={source} onChange={setSource} testid="new-order-source"
          options={[['stock', 'From stock (no price)'], ...lists.map((l) => [l.id, l.name])]} />
        {source === 'stock' && <div className="text-[11px] text-slate-500 -mt-1">Models come from your imported stock. Quantity only — no price.</div>}
      </div>

      {!dealerId ? (
        <div className="text-center text-slate-400 text-sm py-8 bg-white border border-dashed border-slate-200 rounded-xl mb-3">Pick a dealer to start adding models.</div>
      ) : (source === 'stock' && !dealerData) ? <Spin /> : (
        <>
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model to add…" data-testid="new-order-search"
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-white text-base outline-none focus:border-emerald-500" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? <div className="text-[12px] text-slate-400 p-3">No models{source === 'stock' ? ' in stock' : ''}.</div> : filtered.map((p) => {
              const b = billed[norm(p.model)]
              return (
                <button key={p.id} data-testid={'add-model-' + norm(p.model)} onClick={() => add(p)} className="w-full flex justify-between items-center px-3 py-2.5 border-b border-slate-50 last:border-0 text-left active:bg-slate-50">
                  <div className="min-w-0 pr-2">
                    <div className="text-[13px] font-semibold text-slate-800 truncate">{p.model}</div>
                    <div className="text-[11px] text-slate-500 flex gap-2 flex-wrap items-center">
                      {p.dp > 0 && <span>{inr(p.dp)}</span>}
                      {p.available != null && <span className={p.available <= 0 ? 'text-red-600' : p.available <= 8 ? 'text-amber-600' : 'text-slate-500'}>{p.available} in stock</span>}
                      {b && <span className="text-amber-700 font-semibold">Billed before: {b.units} · {inr(b.value)}</span>}
                    </div>
                  </div>
                  <Plus size={16} className="text-emerald-700 shrink-0" />
                </button>
              )
            })}
          </div>
        </>
      )}

      {items.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
          <div className="px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">Order · {items.length} items</div>
          {items.map((it) => (
            <div key={it.model} className="flex justify-between items-center px-3 py-2 border-b border-slate-50 last:border-0 text-[13px]">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-800 truncate">{it.model}</div>
                <div className="text-[11px] text-slate-500">{it.dp ? inr(it.dp) + ' each' : 'no price'}{it.billed_value > 0 ? ' · billed before ' + inr(it.billed_value) : ''}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button data-testid={'dec-' + norm(it.model)} onClick={() => dec(norm(it.model))} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><Minus size={13} /></button>
                <span className="w-6 text-center font-semibold">{it.qty}</span>
                <button data-testid={'inc-' + norm(it.model)} onClick={() => add(it)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><Plus size={13} /></button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 font-bold"><span>Total</span><span>{total > 0 ? inr(total) : items.reduce((s, i) => s + i.qty, 0) + ' pcs'}</span></div>
          {owed > 0 && (
            <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-[12px] text-amber-800">
              Dealer already billed for these models: <b>{inr(owed)}</b>
            </div>
          )}
        </div>
      )}

      <Field label="Note (optional)" value={note} onChange={setNote} />
      <button onClick={save} disabled={busy} data-testid="save-order-btn" className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60">Save order</button>
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Minus, Trash2, Check } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, SectionH, Modal, Field, Select, Pill } from '../../components/ui.jsx'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { useAuth } from '../../auth/AuthContext.jsx'

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
          <button key={k} onClick={() => setTab(k)}
            className={'flex-1 py-2 rounded-lg text-[13px] font-semibold ' + (tab === k ? 'bg-white text-slate-900 shadow' : 'text-slate-500')}>{l}</button>
        ))}
      </div>

      {!orders ? <Spin /> : orders.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          {tab === 'pending' ? 'No pending orders. Tap “+ Add”.' : 'No executed orders yet.'}
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {orders.map((o) => (
            <button key={o.id} onClick={() => setDetail(o)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">{o.dealer_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{o.items.length} items · by {o.created_by} · {o.date}</div>
                  {o.status === 'executed'
                    ? <Pill tone="ok">Executed{o.bill_no ? ' · ' + o.bill_no : ''}</Pill>
                    : <Pill tone="over">Pending</Pill>}
                </div>
                <div className="text-[15px] font-bold shrink-0">{inr(o.total)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {detail && <OrderDetail order={detail} staff={staff} onClose={() => setDetail(null)} onChanged={() => { setDetail(null); load() }} />}
    </>
  )
}

function OrderDetail({ order, staff, onClose, onChanged }) {
  const [billNo, setBillNo] = useState('')
  const [busy, setBusy] = useState(false)
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
      <div className="text-[12px] text-slate-500 mb-2">{order.pricelist_name ? order.pricelist_name + ' · ' : ''}by {order.created_by} · {order.date}</div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-2 border-b border-slate-50 last:border-0 text-[13px]">
            <div className="min-w-0 pr-2"><div className="font-semibold text-slate-800 truncate">{it.model}</div><div className="text-[11px] text-slate-500">{it.qty} × {inr(it.dp)}</div></div>
            <div className="font-bold text-slate-900 shrink-0">{inr(it.dp * it.qty)}</div>
          </div>
        ))}
        <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 text-[14px] font-bold"><span>Total</span><span>{inr(order.total)}</span></div>
      </div>
      {order.note && <div className="text-[12px] text-slate-500 mb-3">Note: {order.note}</div>}

      {order.status === 'executed' ? (
        <div className="text-[13px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          Executed by {order.executed_by}{order.bill_no ? ' · Bill ' + order.bill_no : ''}{order.executed_at ? ' · ' + order.executed_at : ''}
        </div>
      ) : staff ? (
        <>
          <Field label="Bill number (from your invoice)" value={billNo} onChange={setBillNo} />
          <button onClick={execute} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? '…' : <><Check size={16} />Mark executed</>}
          </button>
          <button onClick={del} className="w-full mt-2 border border-red-200 text-red-700 font-semibold py-2.5 rounded-xl text-[13px]">Delete order</button>
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
  const [listId, setListId] = useState('')
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [cart, setCart] = useState({})   // model -> {model, description, dp, qty}
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.dealers().then(setDealers); api.pricelists().then(setLists) }, [])
  useEffect(() => {
    if (!listId) { setProducts([]); return }
    const pl = lists.find((l) => l.id === listId)
    const mc = pl?.model_col || 'Model', pc = pl?.price_col || 'DP'
    api.pricelistProducts(listId).then((ps) => setProducts(
      ps.map((p) => ({ id: p.id, model: String(p.cells?.[mc] ?? ''), dp: Number(p.cells?.[pc]) || 0 })).filter((p) => p.model)
    ))
  }, [listId, lists])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    return products.filter((p) => !n || p.model.toLowerCase().includes(n)).slice(0, 60)
  }, [products, q])
  const items = Object.values(cart)
  const total = items.reduce((s, i) => s + (i.dp || 0) * i.qty, 0)

  const add = (p) => setCart((c) => ({ ...c, [p.model]: { model: p.model, dp: p.dp || 0, qty: (c[p.model]?.qty || 0) + 1 } }))
  const dec = (m) => setCart((c) => { const it = c[m]; if (!it) return c; const qty = it.qty - 1; const n = { ...c }; if (qty <= 0) delete n[m]; else n[m] = { ...it, qty }; return n })

  const save = async () => {
    if (!dealerId) return toast.error('Pick a dealer')
    if (items.length === 0) return toast.error('Add at least one item')
    setBusy(true)
    try {
      const pl = lists.find((l) => l.id === listId)
      await api.createOrder({ dealer_id: dealerId, pricelist_name: pl?.name || '', note, items: items.map((i) => ({ model: i.model, dp: i.dp, qty: i.qty })) })
      toast.success('Order saved'); onDone()
    } catch (e) { toast.error(e.message); setBusy(false) }
  }

  return (
    <>
      <button onClick={onClose} className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">‹ Orders</button>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">New order</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <Select label="Dealer" value={dealerId} onChange={setDealerId} options={[['', '— pick dealer —'], ...dealers.map((d) => [d.id, d.name])]} />
        <Select label="Price list" value={listId} onChange={setListId} options={[['', '— pick price list —'], ...lists.map((l) => [l.id, l.name])]} />
      </div>

      {listId && (
        <>
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model to add…"
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-white text-base outline-none focus:border-emerald-500" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? <div className="text-[12px] text-slate-400 p-3">No products.</div> : filtered.map((p) => (
              <button key={p.id} onClick={() => add(p)} className="w-full flex justify-between items-center px-3 py-2.5 border-b border-slate-50 last:border-0 text-left active:bg-slate-50">
                <div className="min-w-0 pr-2"><div className="text-[13px] font-semibold text-slate-800 truncate">{p.model}</div><div className="text-[11px] text-slate-500">{inr(p.dp)}</div></div>
                <Plus size={16} className="text-emerald-700 shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      {items.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
          <div className="px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">Order · {items.length} items</div>
          {items.map((it) => (
            <div key={it.model} className="flex justify-between items-center px-3 py-2 border-b border-slate-50 last:border-0 text-[13px]">
              <div className="min-w-0 pr-2"><div className="font-semibold text-slate-800 truncate">{it.model}</div><div className="text-[11px] text-slate-500">{inr(it.dp)} each</div></div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => dec(it.model)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><Minus size={13} /></button>
                <span className="w-6 text-center font-semibold">{it.qty}</span>
                <button onClick={() => add(it)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><Plus size={13} /></button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 font-bold"><span>Total</span><span>{inr(total)}</span></div>
        </div>
      )}

      <Field label="Note (optional)" value={note} onChange={setNote} />
      <button onClick={save} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60">Save order</button>
    </>
  )
}

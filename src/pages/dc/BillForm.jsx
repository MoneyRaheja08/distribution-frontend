import { useEffect, useMemo, useState } from 'react'
import { Check, Lock, Repeat, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Modal } from '../../components/ui.jsx'
import { inp, Field, MODES, PrimaryBtn } from './bits.jsx'

const OLD_ITEMS = ['OLD AC', 'OLD W/M', 'OLD LED', 'OLD REFRIGERATOR', 'OLD GEYSER', 'OLD INVERTER', 'OLD BATTERY', 'OLD M/W', 'OTHER']
const num = (v) => (v === 0 || v == null ? '' : String(v))
const emptyItem = () => ({ model: '', brand: '', category: '', nlc: '' })
const emptyEx = () => ({ model: '', value: '', note: '' })

export default function BillForm({ date, admin, bill, onClose, onSaved }) {
  const { auth } = useAuth()
  const [f, setF] = useState({
    customer: bill?.customer || '', phone: bill?.phone || '', note: bill?.note || '',
    total: num(bill?.total), cash: num(bill?.cash), card: num(bill?.card), upi: num(bill?.upi), finance: num(bill?.finance), pending: num(bill?.pending),
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const [items, setItems] = useState(() => {
    if (bill && bill.items?.length) {
      const arr = bill.items.map((i) => ({ model: i.model || '', brand: i.brand || '', category: i.category || '', nlc: num(i.nlc) }))
      if (admin && bill.nlc && !arr[0].nlc) arr[0].nlc = String(bill.nlc)
      return arr
    }
    return [emptyItem()]
  })
  const [exs, setExs] = useState([emptyEx()])
  const [collectedBy, setCollectedBy] = useState(bill?.staff_id || (admin ? '' : auth.user.id))
  const [users, setUsers] = useState([])
  const [mySeries, setMySeries] = useState({})
  useEffect(() => { api.dcMyPerms().then((r) => setMySeries(r.series || {})).catch(() => {}) }, [])
  const seriesFor = (id) => (admin && id ? (users.find((u) => u.id === id)?.series || {}) : mySeries)
  const sr = seriesFor(collectedBy)
  const nextNo = sr.prefix || sr.next ? (sr.prefix || '') + String(Math.max(1, +sr.next || 1)).padStart(Math.max(1, +sr.pad || 4), '0') : ''
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(() => bill ? Math.max(0, Math.floor(bill.editable_until - Date.now() / 1000)) : null)
  useEffect(() => { if (admin) api.dcUsers().then(setUsers).catch(() => {}) }, [admin])
  useEffect(() => {
    if (!bill) return
    const t = setInterval(() => setLeft(Math.max(0, Math.floor(bill.editable_until - Date.now() / 1000))), 1000)
    return () => clearInterval(t)
  }, [bill])
  const expired = bill && left === 0
  const upItem = (i, k, v) => setItems((a) => a.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const upEx = (i, k, v) => setExs((a) => a.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const paid = useMemo(() => MODES.reduce((s, [k]) => s + (+f[k] || 0), 0), [f])
  const total = +f.total || 0
  const autoPending = Math.max(0, total - paid)
  const pending = f.pending === '' ? autoPending : +f.pending || 0
  const over = paid + pending - total
  const fillRest = (k) => set(k, String(Math.max(0, total - (paid - (+f[k] || 0)))))
  const itemNlc = items.reduce((s, i) => s + (+i.nlc || 0), 0)

  const save = async () => {
    if (!(total > 0)) return toast.error('Enter a bill total')
    if (over > 0) return toast.error('Payments exceed bill total by ' + inr(over))
    if (expired) return toast.error('Bill is locked')
    setBusy(true)
    try {
      const body = {
        customer: f.customer, phone: f.phone, note: f.note, total, pending,
        cash: +f.cash || 0, card: +f.card || 0, upi: +f.upi || 0, finance: +f.finance || 0,
        items: items.filter((i) => i.model || i.brand || i.nlc).map((i) => ({ brand: i.brand, category: i.category, model: i.model, qty: 1, nlc: +i.nlc || 0 })),
      }
      if (admin && collectedBy) body.staff_id = collectedBy
      if (bill) { await api.dcUpdateBill(bill.id, body); toast.success('Bill updated') }
      else {
        body.exchanges = exs.filter((e) => e.model).map((e) => ({ model: e.model, note: e.note, value: +e.value || 0 }))
        await api.dcCreateBill({ ...body, date }); toast.success('Bill saved')
      }
      onSaved()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={bill ? 'Edit bill' + (bill.bill_no ? ' #' + bill.bill_no : '') : 'New bill'} onClose={onClose}>
      {bill && (
        <div data-testid="dc-edit-timer" className={'flex items-center justify-between rounded-xl px-3.5 py-2.5 mb-4 text-[12.5px] font-semibold ' + (expired ? 'bg-red-50 text-red-700' : left < 30 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600')}>
          <span className="flex items-center gap-1.5"><Lock size={13} />{expired ? 'Locked — edit window over' : 'Editable for'}</span>
          {!expired && <span className="font-display text-base font-bold tabular-nums">{String(Math.floor(left / 60)).padStart(1, '0')}:{String(left % 60).padStart(2, '0')}</span>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer"><input data-testid="dc-customer" className={inp} placeholder="Walk-in" value={f.customer} onChange={(e) => set('customer', e.target.value)} /></Field>
        <Field label="Phone"><input className={inp} type="tel" placeholder="98xxxxxxxx" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        {admin ? (
          <Field label="Collected by">
            <select data-testid="dc-collected-by" className={inp} value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)}>
              <option value="">Me — {auth.user.name}</option>
              {users.filter((u) => u.id !== auth.user.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Collected by"><input className={inp + ' bg-slate-50 text-slate-500'} value={auth.user.name} disabled /></Field>
        )}
        <Field label="Bill number" hint="auto from series"><input data-testid="dc-bill-no" className={inp + ' bg-slate-50 text-slate-500 font-semibold'} value={bill ? bill.bill_no : (nextNo || 'Auto-assigned')} disabled /></Field>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5">Items</div>
        {items.map((it, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 p-2.5 mb-2">
            <div className="flex gap-2 items-start">
              <input data-testid={'dc-item-model-' + idx} className={inp} placeholder={'Model / product e.g. Samsung 55" TV'} value={it.model} onChange={(e) => upItem(idx, 'model', e.target.value)} />
              {items.length > 1 && <button type="button" data-testid={'dc-item-del-' + idx} onClick={() => setItems((a) => a.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-600 p-1.5 mt-0.5"><Trash2 size={16} /></button>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input className={inp} placeholder="Brand" value={it.brand} onChange={(e) => upItem(idx, 'brand', e.target.value)} />
              <input className={inp} placeholder="Category" value={it.category} onChange={(e) => upItem(idx, 'category', e.target.value)} />
              {admin && <input data-testid={'dc-item-nlc-' + idx} className={inp + ' col-span-2'} type="number" inputMode="decimal" placeholder="NLC — cost of this item (₹)" value={it.nlc} onChange={(e) => upItem(idx, 'nlc', e.target.value)} />}
            </div>
          </div>
        ))}
        <button type="button" data-testid="dc-add-item" onClick={() => setItems((a) => [...a, emptyItem()])} className="text-[13px] font-bold text-brand-600 flex items-center gap-1"><Plus size={15} /> Add another item</button>
      </div>

      <div className="mt-4">
        <Field label="Bill total"><input data-testid="dc-total" className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" placeholder="₹ 0" value={f.total} onChange={(e) => set('total', e.target.value)} /></Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[['cash', 'Full Cash', 'border-emerald-300 text-emerald-700'], ['upi', 'Full GPay', 'border-sky-300 text-sky-700'], ['card', 'Full Card', 'border-violet-300 text-violet-700'], ['finance', 'Full Finance', 'border-amber-300 text-amber-700']].map(([k, l, c]) => (
          <button key={k} type="button" data-testid={'dc-qf-' + k} onClick={() => setF((p) => ({ ...p, cash: '', card: '', upi: '', finance: '', pending: '', [k]: String(+p.total || 0) }))} className={'text-[12px] font-bold rounded-full px-3 py-1.5 border ' + c}>{l}</button>
        ))}
        <button type="button" data-testid="dc-qf-pending" onClick={() => set('pending', String(Math.max(0, total - (paid - (+f.pending || 0)))))} className="text-[12px] font-bold rounded-full px-3 py-1.5 border border-rose-300 text-rose-700">Rest → Pending</button>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2.5"><span>Payment split</span><span className={over > 0 ? 'text-red-600' : 'text-slate-400'}>{inr(paid)} of {inr(total)}</span></div>
        <div className="grid grid-cols-2 gap-2.5">
          {MODES.map(([k, l, bar]) => (
            <div key={k} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl pl-3 pr-1 py-1 focus-within:border-brand-500">
              <span className={'h-2 w-2 rounded-full shrink-0 ' + bar} />
              <span className="text-[12px] font-semibold text-slate-600 w-12">{l}</span>
              <input data-testid={'dc-pay-' + k} className="flex-1 min-w-0 text-[14px] font-semibold text-slate-900 outline-none py-1.5 text-right" type="number" inputMode="decimal" placeholder="0" value={f[k]} onChange={(e) => set(k, e.target.value)} />
              <button type="button" title="Fill remaining" onClick={() => fillRest(k)} className="text-slate-300 hover:text-brand-600 p-1"><Check size={14} /></button>
            </div>
          ))}
          <div className={'flex items-center gap-2 border rounded-xl pl-3 pr-2 py-1 ' + (pending > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
            <span className="text-[12px] font-semibold text-amber-700 w-14">Pending</span>
            <input data-testid="dc-pending" className="flex-1 min-w-0 bg-transparent text-[14px] font-bold text-amber-800 outline-none py-1.5 text-right" type="number" inputMode="decimal" value={f.pending === '' ? (autoPending || '') : f.pending} placeholder="0" onChange={(e) => set('pending', e.target.value)} />
          </div>
        </div>
        {over > 0 && <div className="text-[11.5px] text-red-600 font-semibold mt-2">Payments exceed total by {inr(over)}</div>}
      </div>

      {!bill && (
        <div className="mt-4 rounded-2xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 mb-2"><Repeat size={15} className="text-brand-600" />Exchange items <span className="text-[11px] text-slate-400 font-normal">(old items taken, if any)</span></div>
          {exs.map((e, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
              <select data-testid={'dc-ex-model-' + idx} className={inp} value={e.model} onChange={(ev) => upEx(idx, 'model', ev.target.value)}><option value="">— Select old item —</option>{OLD_ITEMS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
              <div className="flex gap-1"><input data-testid={'dc-ex-value-' + idx} className={inp} type="number" inputMode="decimal" placeholder="Est. value ₹" value={e.value} onChange={(ev) => upEx(idx, 'value', ev.target.value)} />{exs.length > 1 && <button type="button" onClick={() => setExs((a) => a.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-600 px-1"><Trash2 size={15} /></button>}</div>
              <input className={inp + ' col-span-2'} placeholder="Note (brand / condition)" value={e.note} onChange={(ev) => upEx(idx, 'note', ev.target.value)} />
            </div>
          ))}
          <button type="button" data-testid="dc-add-exchange" onClick={() => setExs((a) => [...a, emptyEx()])} className="text-[13px] font-bold text-brand-600 flex items-center gap-1"><Plus size={15} /> Add exchange item</button>
          <div className="text-[11px] text-slate-400 mt-1.5">Resell later from the Exchange screen — that money is credited to the seller's cash in hand.</div>
        </div>
      )}
      {bill && bill.exchanges?.length > 0 && <div className="mt-3 text-[12px] text-slate-500 flex items-center gap-1.5"><Repeat size={13} className="text-brand-600" />{bill.exchanges.length} exchange item(s) on this bill — manage them in the Exchange screen.</div>}

      <div className="mt-4"><Field label="Note"><input className={inp} placeholder="e.g. delivery pending" value={f.note} onChange={(e) => set('note', e.target.value)} /></Field></div>
      {admin && total > 0 && itemNlc > 0 && <div className="text-[12px] text-emerald-700 font-semibold mt-2">Profit on this bill: {inr(total - itemNlc)}</div>}

      <div className="mt-5"><PrimaryBtn testid="dc-add-bill" onClick={save} disabled={busy || expired}>{bill ? 'Update bill' : 'Add bill'} · {inr(total)}</PrimaryBtn></div>
    </Modal>
  )
}

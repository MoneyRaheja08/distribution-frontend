import { useEffect, useMemo, useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Modal } from '../../components/ui.jsx'
import { inp, Field, MODES, PrimaryBtn } from './bits.jsx'

const blank = { bill_no: '', customer: '', phone: '', brand: '', model: '', total: '', cash: '', card: '', upi: '', finance: '', cheque: '', nlc: '', pending: '', note: '' }

export default function BillForm({ date, admin, bill, onClose, onSaved }) {
  const [f, setF] = useState(() => bill ? { ...blank, ...Object.fromEntries(Object.entries(bill).filter(([k]) => k in blank).map(([k, v]) => [k, v === 0 ? '' : String(v ?? '')])), model: bill.items?.[0]?.model || '', brand: bill.items?.[0]?.brand || '', pending: String(bill.pending || '') } : blank)
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(() => bill ? Math.max(0, Math.floor(bill.editable_until - Date.now() / 1000)) : null)
  useEffect(() => {
    if (!bill) return
    const t = setInterval(() => setLeft(Math.max(0, Math.floor(bill.editable_until - Date.now() / 1000))), 1000)
    return () => clearInterval(t)
  }, [bill])
  const expired = bill && left === 0
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const paid = useMemo(() => MODES.reduce((s, [k]) => s + (+f[k] || 0), 0), [f])
  const total = +f.total || 0
  const autoPending = Math.max(0, total - paid)
  const pending = f.pending === '' ? autoPending : +f.pending || 0
  const over = paid + pending - total
  const fillRest = (k) => set(k, String(Math.max(0, total - (paid - (+f[k] || 0)))))

  const save = async () => {
    if (!(total > 0)) return toast.error('Enter a bill total')
    if (over > 0) return toast.error('Payments exceed bill total by ' + inr(over))
    if (expired) return toast.error('Bill is locked')
    setBusy(true)
    try {
      const body = { bill_no: f.bill_no, customer: f.customer, phone: f.phone, note: f.note, total, pending, nlc: +f.nlc || 0,
        items: f.model || f.brand ? [{ brand: f.brand, model: f.model, qty: 1 }] : [] }
      MODES.forEach(([k]) => { body[k] = +f[k] || 0 })
      if (bill) { await api.dcUpdateBill(bill.id, body); toast.success('Bill updated') }
      else { await api.dcCreateBill({ ...body, date }); toast.success('Bill saved') }
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
        <Field label="Bill no"><input data-testid="dc-bill-no" className={inp} placeholder="#" value={f.bill_no} onChange={(e) => set('bill_no', e.target.value)} /></Field>
        <Field label="Brand / Model"><input className={inp} placeholder="e.g. Haier 1.5T" value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <div className="col-span-2">
          <Field label="Bill total"><input data-testid="dc-total" className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" placeholder="₹ 0" value={f.total} onChange={(e) => set('total', e.target.value)} /></Field>
        </div>
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

      <div className="grid grid-cols-2 gap-3 mt-4">
        {admin && <Field label="NLC / cost" hint="admin only"><input data-testid="dc-nlc" className={inp} type="number" inputMode="decimal" placeholder="₹ 0" value={f.nlc} onChange={(e) => set('nlc', e.target.value)} /></Field>}
        <div className={admin ? '' : 'col-span-2'}><Field label="Note"><input className={inp} placeholder="optional" value={f.note} onChange={(e) => set('note', e.target.value)} /></Field></div>
      </div>
      {admin && total > 0 && +f.nlc > 0 && <div className="text-[12px] text-emerald-700 font-semibold mt-2">Profit on this bill: {inr(total - +f.nlc)}</div>}

      <div className="mt-5"><PrimaryBtn testid="dc-add-bill" onClick={save} disabled={busy || expired}>{bill ? 'Update bill' : 'Save bill'} · {inr(total)}</PrimaryBtn></div>
    </Modal>
  )
}

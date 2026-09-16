import { useEffect, useState } from 'react'
import { CreditCard, ChevronDown, Check, Pencil, RotateCcw } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin, Modal, EmptyState } from '../../components/ui.jsx'

const STATUSES = [['outstanding', 'Outstanding'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['all', 'All']]

function dueChip(r) {
  if (r.paid) return ['Paid' + (r.paid_on ? ' · ' + r.paid_on : ''), 'text-slate-600 bg-slate-100 ring-slate-200']
  if (r.days_left == null) return ['No bill date', 'text-slate-500 bg-slate-100 ring-slate-200']
  if (r.days_left < 0) return ['Overdue ' + Math.abs(r.days_left) + 'd', 'text-red-700 bg-red-50 ring-red-100']
  if (r.days_left === 0) return ['Due today', 'text-amber-700 bg-amber-50 ring-amber-100']
  if (r.days_left <= 7) return ['Due in ' + r.days_left + 'd', 'text-amber-700 bg-amber-50 ring-amber-100']
  return [r.days_left + 'd left', 'text-brand-700 bg-brand-50 ring-brand-100']
}

function Stat({ label, v, sub, tone }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={'font-display text-base font-bold mt-0.5 ' + (tone || 'text-slate-900')}>{v}</div>
      {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
    </div>
  )
}

function BillRow({ r, onEdit, onPay }) {
  const [chip, cls] = dueChip(r)
  return (
    <div className="flex items-center justify-between px-4 py-2.5" data-testid={'bill-' + r.bill_no}>
      <div className="min-w-0 pr-2">
        <div className="text-[13px] font-semibold text-slate-800 truncate">{r.bill_no}</div>
        <div className="text-[11px] text-slate-400 truncate">{r.supplier} · {r.date || 'no date'} · {r.credit_days}d{r.credit_override ? '*' : ''}{r.due_date ? ' → ' + r.due_date : ''}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900">{inr(r.amount)}</div>
          <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ' + cls}>{chip}</span>
        </div>
        <button data-testid={'pay-' + r.bill_no} onClick={onPay} title={r.paid ? 'Mark unpaid' : 'Mark paid'}
          className={'rounded-lg p-1.5 transition-colors ' + (r.paid ? 'text-slate-400 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50')}>{r.paid ? <RotateCcw size={15} /> : <Check size={16} />}</button>
        <button data-testid={'edit-' + r.bill_no} onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"><Pencil size={14} /></button>
      </div>
    </div>
  )
}

function BrandTerms({ terms, onSaved }) {
  const [vals, setVals] = useState(() => Object.fromEntries(terms.map((t) => [t.brand, t.credit_days])))
  const save = async (brand) => {
    await api.savePayableBrandTerm({ brand, credit_days: +vals[brand] || 0 })
    toast.success(brand + ' terms saved')
    onSaved()
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">Payment terms per brand (credit days)</div>
      {terms.length === 0 ? <div className="text-[12px] text-slate-400 py-2">No purchase brands yet. Import purchases first.</div> : (
        <div className="space-y-1.5">
          {terms.map((t) => (
            <div key={t.brand} className="flex items-center gap-2">
              <div className="flex-1 text-[13px] font-semibold text-slate-700 truncate">{t.brand}</div>
              <input data-testid={'term-' + t.brand} type="number" min="0" value={vals[t.brand] ?? ''}
                onChange={(e) => setVals((v) => ({ ...v, [t.brand]: e.target.value }))}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] text-right outline-none focus:border-brand-500" />
              <span className="text-[11px] text-slate-400">days</span>
              <button data-testid={'save-term-' + t.brand} onClick={() => save(t.brand)} className="text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-2.5 py-1.5 transition-colors">Save</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BillEditModal({ r, onClose, onSaved }) {
  const [cd, setCd] = useState(r.credit_days)
  const [paid, setPaid] = useState(r.paid)
  const [paidOn, setPaidOn] = useState(r.paid_on || new Date().toISOString().slice(0, 10))
  const save = async () => {
    await api.savePayableBill({ bill_no: r.bill_no, credit_days: +cd || 0, paid, paid_on: paid ? paidOn : null })
    toast.success('Saved')
    onSaved()
  }
  return (
    <Modal title={'Bill ' + r.bill_no} onClose={onClose}>
      <div className="space-y-3">
        <div className="text-[12px] text-slate-500">{r.brand} · {r.supplier} · {inr(r.amount)} · billed {r.date || '—'}</div>
        <label className="block text-[12px] font-semibold text-slate-600">Credit days (override brand default)
          <input data-testid="edit-credit-days" type="number" min="0" value={cd} onChange={(e) => setCd(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-brand-500" />
        </label>
        <button type="button" data-testid="edit-paid-toggle" onClick={() => setPaid((p) => !p)} className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5 bg-white">
          <span className="text-[13px] font-semibold text-slate-700">Marked paid</span>
          <span className={'w-11 h-6 rounded-full relative transition-colors ' + (paid ? 'bg-emerald-600' : 'bg-slate-300')}><span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ' + (paid ? 'left-[22px]' : 'left-0.5')} /></span>
        </button>
        {paid && <label className="block text-[12px] font-semibold text-slate-600">Paid on<input data-testid="edit-paid-on" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-brand-500" /></label>}
        <button data-testid="edit-save" onClick={save} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Save</button>
      </div>
    </Modal>
  )
}

export default function CompanyPayments() {
  const [status, setStatus] = useState('outstanding')
  const [data, setData] = useState(null)
  const [terms, setTerms] = useState(null)
  const [open, setOpen] = useState({})
  const [showTerms, setShowTerms] = useState(false)
  const [edit, setEdit] = useState(null)

  const load = () => { api.payables(status).then(setData); api.payableBrandTerms().then((t) => setTerms(t.brands)) }
  useEffect(load, [status])

  const pay = async (r) => {
    await api.savePayableBill({ bill_no: r.bill_no, paid: !r.paid })
    toast.success(r.paid ? 'Marked unpaid' : 'Marked paid')
    load()
  }

  if (!data || !terms) return <Spin />
  const flat = status === 'paid' || status === 'all'
  const rowsByBrand = {}
  data.rows.forEach((r) => { (rowsByBrand[r.brand] = rowsByBrand[r.brand] || []).push(r) })

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">Company payments</h1>
          <div className="text-[12px] text-slate-500">What you owe suppliers, by due date</div>
        </div>
        <button data-testid="toggle-terms" onClick={() => setShowTerms((v) => !v)} className="text-[12px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5">Payment terms</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Outstanding" v={inr(data.totals.outstanding)} sub={data.totals.bills + ' bills'} />
        <Stat label="Overdue" v={inr(data.totals.overdue)} tone="text-red-600" />
        <Stat label="Due in 7 days" v={inr(data.totals.due_7)} tone="text-amber-600" />
      </div>

      {showTerms && <BrandTerms terms={terms} onSaved={load} />}

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {STATUSES.map(([k, l]) => (
          <button key={k} data-testid={'status-' + k} onClick={() => setStatus(k)}
            className={'text-[12px] font-semibold rounded-full px-3 py-1.5 border shrink-0 transition-colors ' + (status === k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>
        ))}
      </div>

      {data.rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nothing here" hint="Import purchases and set brand payment terms to see supplier dues." />
      ) : flat ? (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50">
          {data.rows.map((r) => <BillRow key={r.bill_no} r={r} onEdit={() => setEdit(r)} onPay={() => pay(r)} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data.summary.map((s) => (
            <div key={s.brand} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button data-testid={'brand-' + s.brand} onClick={() => setOpen((o) => ({ ...o, [s.brand]: !o[s.brand] }))} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-900 truncate">{s.brand}</div>
                  <div className="text-[11px] text-slate-500">{s.bills} bills{s.next_due ? ' · next due ' + s.next_due : ''}{s.overdue_amount > 0 ? ' · overdue ' + inr(s.overdue_amount) : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="font-display font-bold text-slate-900">{inr(s.amount)}</div>
                  <ChevronDown size={16} className={'text-slate-400 transition-transform ' + (open[s.brand] ? 'rotate-180' : '')} />
                </div>
              </button>
              {open[s.brand] && <div className="border-t border-slate-100 divide-y divide-slate-50">{(rowsByBrand[s.brand] || []).map((r) => <BillRow key={r.bill_no} r={r} onEdit={() => setEdit(r)} onPay={() => pay(r)} />)}</div>}
            </div>
          ))}
        </div>
      )}

      {edit && <BillEditModal r={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </>
  )
}

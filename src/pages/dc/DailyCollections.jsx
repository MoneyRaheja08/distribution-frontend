import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'

const TABS = [['register', 'Collections'], ['pending', 'Pending'], ['expenses', 'Expenses'], ['day', 'Day close']]
const today = () => new Date().toISOString().slice(0, 10)
const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-brand-500'

export default function DailyCollections() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const [tab, setTab] = useState('register')
  const [date, setDate] = useState(today())
  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h1 className="font-display text-xl font-bold text-slate-900">Daily Collections</h1>
        <input type="date" data-testid="dc-date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px]" />
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {TABS.map(([k, l]) => (
          <button key={k} data-testid={'dc-tab-' + k} onClick={() => setTab(k)}
            className={'text-[13px] font-semibold rounded-full px-3.5 py-1.5 border shrink-0 transition-colors ' + (tab === k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>
        ))}
      </div>
      {tab === 'register' && <Register date={date} admin={admin} />}
      {tab === 'pending' && <Pending admin={admin} />}
      {tab === 'expenses' && <Expenses date={date} />}
      {tab === 'day' && <DayClose date={date} admin={admin} />}
    </>
  )
}

const blankBill = { bill_no: '', customer: '', phone: '', total: '', cash: '', card: '', upi: '', finance: '', cheque: '', nlc: '', pending: '', note: '' }

function Register({ date, admin }) {
  const [data, setData] = useState(null)
  const [f, setF] = useState(blankBill)
  const [busy, setBusy] = useState(false)
  const load = () => api.dcBills('?date=' + date).then(setData)
  useEffect(() => { setData(null); load() }, [date]) // eslint-disable-line
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!(+f.total > 0)) return toast.error('Enter a bill total')
    setBusy(true)
    try {
      const body = { date, bill_no: f.bill_no, customer: f.customer, phone: f.phone, note: f.note }
      ;['total', 'cash', 'card', 'upi', 'finance', 'cheque', 'nlc', 'pending'].forEach((k) => { body[k] = +f[k] || 0 })
      await api.dcCreateBill(body); toast.success('Bill added'); setF(blankBill); load()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  const del = async (id) => { await api.dcDeleteBill(id); load() }
  if (!data) return <Spin />
  const t = data.totals || {}
  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Collected" v={inr(t.total || 0)} sub={(t.bills || 0) + ' bills'} />
        <Stat label="Cash" v={inr(t.cash || 0)} />
        {admin ? <Stat label="Profit" v={inr(t.profit || 0)} tone="text-emerald-600" /> : <Stat label="Pending" v={inr(t.pending || 0)} tone="text-amber-600" />}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">Add bill</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input data-testid="dc-bill-no" className={inp} placeholder="Bill no" value={f.bill_no} onChange={(e) => set('bill_no', e.target.value)} />
          <input data-testid="dc-customer" className={inp} placeholder="Customer" value={f.customer} onChange={(e) => set('customer', e.target.value)} />
          <input className={inp} placeholder="Phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          <input data-testid="dc-total" className={inp} type="number" placeholder="Total ₹" value={f.total} onChange={(e) => set('total', e.target.value)} />
          <input className={inp} type="number" placeholder="Cash ₹" value={f.cash} onChange={(e) => set('cash', e.target.value)} />
          <input className={inp} type="number" placeholder="Card ₹" value={f.card} onChange={(e) => set('card', e.target.value)} />
          <input className={inp} type="number" placeholder="UPI ₹" value={f.upi} onChange={(e) => set('upi', e.target.value)} />
          <input className={inp} type="number" placeholder="Finance ₹" value={f.finance} onChange={(e) => set('finance', e.target.value)} />
          <input className={inp} type="number" placeholder="Cheque ₹" value={f.cheque} onChange={(e) => set('cheque', e.target.value)} />
          <input data-testid="dc-pending" className={inp} type="number" placeholder="Pending ₹" value={f.pending} onChange={(e) => set('pending', e.target.value)} />
          {admin && <input data-testid="dc-nlc" className={inp} type="number" placeholder="NLC / cost ₹" value={f.nlc} onChange={(e) => set('nlc', e.target.value)} />}
        </div>
        <input className={inp + ' mb-2'} placeholder="Note (optional)" value={f.note} onChange={(e) => set('note', e.target.value)} />
        <button data-testid="dc-add-bill" onClick={save} disabled={busy} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60 transition-colors"><Plus size={16} />Add bill</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50">
        {data.rows.length === 0 ? <div className="p-4 text-[13px] text-slate-400">No bills for this day.</div> : data.rows.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-4 py-2.5" data-testid={'dc-row-' + b.id}>
            <div className="min-w-0 pr-2">
              <div className="text-[13px] font-semibold text-slate-800 truncate">{b.bill_no || '—'} · {b.customer || 'Walk-in'}</div>
              <div className="text-[11px] text-slate-400">{b.pending > 0 ? 'pending ' + inr(b.pending) + ' · ' : ''}{admin ? 'profit ' + inr(b.profit || 0) : ''}{b.staff ? ' · ' + b.staff : ''}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-[13px] font-bold text-slate-900">{inr(b.total)}</div>
              <button onClick={() => del(b.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Pending({ admin }) {
  const [data, setData] = useState(null)
  const from = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10)
  const load = () => api.dcPending('?frm=' + from + '&to=' + today()).then(setData)
  useEffect(() => { load() }, []) // eslint-disable-line
  const collect = async (b) => {
    const a = prompt('Amount received for ' + (b.customer || b.bill_no) + ' (pending ' + b.pending + ')', String(b.pending))
    if (a == null) return
    await api.dcCollect(b.id, { amount: +a || 0, mode: 'cash' }); toast.success('Recorded'); load()
  }
  if (!data) return <Spin />
  return (
    <>
      <Stat label="Total pending" v={inr(data.total || 0)} sub={(data.count || 0) + ' bills'} tone="text-amber-600" />
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50 mt-3">
        {data.rows.length === 0 ? <div className="p-4 text-[13px] text-slate-400">No pending payments 🎉</div> : data.rows.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-4 py-2.5">
            <div className="min-w-0 pr-2">
              <div className="text-[13px] font-semibold text-slate-800 truncate">{b.customer || 'Walk-in'} · {b.bill_no || '—'}</div>
              <div className="text-[11px] text-slate-400">{b.date}{b.phone ? ' · ' + b.phone : ''}{b.staff ? ' · ' + b.staff : ''}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-[13px] font-bold text-amber-700">{inr(b.pending)}</div>
              <button data-testid={'dc-collect-' + b.id} onClick={() => collect(b)} className="text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-2.5 py-1.5">Collect</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Expenses({ date }) {
  const [data, setData] = useState(null)
  const [f, setF] = useState({ category: '', amount: '', paid_by: '', note: '' })
  const load = () => api.dcExpenses('?date=' + date).then(setData)
  useEffect(() => { setData(null); load() }, [date]) // eslint-disable-line
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!(+f.amount > 0)) return toast.error('Enter amount')
    await api.dcCreateExpense({ date, category: f.category, amount: +f.amount || 0, paid_by: f.paid_by, note: f.note })
    setF({ category: '', amount: '', paid_by: '', note: '' }); toast.success('Expense added'); load()
  }
  const del = async (id) => { await api.dcDeleteExpense(id); load() }
  if (!data) return <Spin />
  return (
    <>
      <Stat label="Expenses today" v={inr(data.total || 0)} />
      <div className="bg-white border border-slate-200 rounded-2xl p-3 my-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input data-testid="dc-exp-cat" className={inp} placeholder="Category" value={f.category} onChange={(e) => set('category', e.target.value)} />
          <input data-testid="dc-exp-amt" className={inp} type="number" placeholder="Amount ₹" value={f.amount} onChange={(e) => set('amount', e.target.value)} />
          <input className={inp} placeholder="Paid by" value={f.paid_by} onChange={(e) => set('paid_by', e.target.value)} />
          <input className={inp} placeholder="Note" value={f.note} onChange={(e) => set('note', e.target.value)} />
        </div>
        <button data-testid="dc-add-exp" onClick={save} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1"><Plus size={16} />Add expense</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50">
        {data.rows.length === 0 ? <div className="p-4 text-[13px] text-slate-400">No expenses.</div> : data.rows.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
            <div className="min-w-0 pr-2"><div className="text-[13px] font-semibold text-slate-800 truncate">{e.category || '—'}</div><div className="text-[11px] text-slate-400">{e.paid_by}{e.note ? ' · ' + e.note : ''}</div></div>
            <div className="flex items-center gap-2 shrink-0"><div className="text-[13px] font-bold text-slate-900">{inr(e.amount)}</div><button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button></div>
          </div>
        ))}
      </div>
    </>
  )
}

function DayClose({ date, admin }) {
  const [d, setD] = useState(null)
  const [f, setF] = useState({ float_open: '', handover: '', note: '' })
  const load = () => api.dcDay(date).then((x) => { setD(x); setF({ float_open: x.float_open || '', handover: x.handover || '', note: x.note || '' }) })
  useEffect(() => { setD(null); load() }, [date]) // eslint-disable-line
  const save = async () => { await api.dcSaveRecon({ date, float_open: +f.float_open || 0, handover: +f.handover || 0, note: f.note }); toast.success('Saved'); load() }
  if (!d) return <Spin />
  const Row = ({ k, v, tone }) => <div className="flex justify-between px-4 py-2 border-b border-slate-50 last:border-0 text-[13px]"><span className="text-slate-500">{k}</span><span className={'font-semibold ' + (tone || 'text-slate-900')}>{v}</span></div>
  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl mb-4">
        <Row k="Bills / Collected" v={d.bills + ' · ' + inr(d.total)} />
        <Row k="Cash" v={inr(d.cash_in)} /><Row k="Card" v={inr(d.card)} /><Row k="UPI" v={inr(d.upi)} />
        <Row k="Finance" v={inr(d.finance)} /><Row k="Cheque" v={inr(d.cheque)} />
        <Row k="Pending" v={inr(d.pending)} tone="text-amber-600" />
        <Row k="Expenses" v={inr(d.expenses)} tone="text-red-600" />
        {admin && <Row k="Profit (total − NLC)" v={inr(d.profit || 0)} tone="text-emerald-600" />}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">Cash reconciliation</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label className="text-[12px] font-semibold text-slate-600">Opening float ₹<input data-testid="dc-float" className={inp + ' mt-1'} type="number" value={f.float_open} onChange={(e) => setF((p) => ({ ...p, float_open: e.target.value }))} /></label>
          <label className="text-[12px] font-semibold text-slate-600">Cash handed over ₹<input data-testid="dc-handover" className={inp + ' mt-1'} type="number" value={f.handover} onChange={(e) => setF((p) => ({ ...p, handover: e.target.value }))} /></label>
        </div>
        <div className="flex justify-between text-[13px] bg-slate-50 rounded-lg px-3 py-2 mb-2">
          <span className="text-slate-500">Expected in drawer (float + cash − expenses)</span>
          <span className="font-bold">{inr(d.expected_in_drawer)}</span>
        </div>
        <div className="flex justify-between text-[13px] px-3 py-1 mb-2"><span className="text-slate-500">Difference vs handover</span><span className={'font-bold ' + (d.diff === 0 ? 'text-emerald-600' : 'text-red-600')}>{inr(d.diff)}</span></div>
        <input className={inp + ' mb-2'} placeholder="Note" value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} />
        <button data-testid="dc-save-recon" onClick={save} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl">Save day close</button>
      </div>
    </>
  )
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

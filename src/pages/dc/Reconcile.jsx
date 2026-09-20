import { useEffect, useState } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'
import { Hero, Stat, ListCard, Row, Chip, PageHead, Section, today, niceDate } from './bits.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const PRESETS = [
  ['today', 'Today', () => [today(), today()]],
  ['week', '7 days', () => [iso(new Date(Date.now() - 6 * 86400000)), today()]],
  ['month', 'This month', () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), today()] }],
]

export default function Reconcile() {
  const [preset, setPreset] = useState('week')
  const [[frm, to], setRange] = useState(PRESETS[1][2]())
  const [tab, setTab] = useState('bills')
  const [data, setData] = useState(null)
  const load = () => api.dcReconcile(frm, to).then(setData)
  useEffect(() => { setData(null); load() }, [frm, to]) // eslint-disable-line
  const pick = (k, fn) => { setPreset(k); setRange(fn()) }
  const c = 'border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold bg-white'
  const toggleBill = async (b) => { setData((d) => ({ ...d, bills: d.bills.map((x) => x.id === b.id ? { ...x, checked: !x.checked } : x) })); await api.dcCheckBill(b.id, !b.checked); load() }
  const toggleRcpt = async (r) => { setData((d) => ({ ...d, receipts: d.receipts.map((x) => x.id === r.id ? { ...x, checked: !x.checked } : x) })); await api.dcCheckReceipt(r.id, !r.checked); load() }
  const Box = ({ on }) => <span className={'flex items-center justify-center h-6 w-6 rounded-md border-2 shrink-0 ' + (on ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent')}><Check size={14} strokeWidth={3} /></span>
  return (
    <>
      <PageHead title="Reconcile" sub={niceDate(frm) + ' → ' + niceDate(to)} />
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {PRESETS.map(([k, l, fn]) => <button key={k} data-testid={'dc-rec-' + k} onClick={() => pick(k, fn)} className={'text-[12.5px] font-semibold rounded-full px-3.5 py-1.5 border transition-colors ' + (preset === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>)}
        <input type="date" className={c} value={frm} onChange={(e) => { setPreset(''); setRange([e.target.value, to]) }} />
        <input type="date" className={c} value={to} onChange={(e) => { setPreset(''); setRange([frm, e.target.value]) }} />
      </div>
      {!data ? <Spin /> : (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Bills checked" v={(data.summary.bills_checked || 0) + '/' + (data.summary.bills || 0)} testid="dc-rec-bills" />
            <Stat label="Receipts checked" v={(data.summary.receipts_checked || 0) + '/' + (data.summary.receipts || 0)} testid="dc-rec-rcpts" />
            <Stat label="Missing bills" v={String(data.summary.missing || 0)} tone={data.summary.missing ? 'text-red-600' : 'text-emerald-600'} testid="dc-rec-missing" />
          </div>

          {data.missing_bill_nos.length > 0 && (
            <div data-testid="dc-rec-missing-card" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-red-700 mb-2"><AlertTriangle size={14} />Missing bill numbers in this range</div>
              <div className="flex flex-wrap gap-1.5">
                {data.missing_bill_nos.map((n) => <Chip key={n} tone="text-red-700 bg-white ring-red-200">#{n}</Chip>)}
              </div>
            </div>
          )}

          <div className="flex gap-1.5 mt-4">
            {[['bills', 'Bills'], ['receipts', 'Receipts']].map(([k, l]) => <button key={k} data-testid={'dc-rec-tab-' + k} onClick={() => setTab(k)} className={'text-[12.5px] font-semibold rounded-full px-3.5 py-1.5 border transition-colors ' + (tab === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>)}
          </div>

          <div className="mt-3">
            {tab === 'bills' ? (
              <ListCard empty="No bills in this range." testid="dc-rec-bill-list">
                {data.bills.map((b) => (
                  <Row key={b.id} testid={'dc-rec-bill-' + b.id} title={(b.customer || 'Walk-in') + (b.bill_no ? ' · #' + b.bill_no : '')} sub={[niceDate(b.date), b.staff].filter(Boolean).join(' · ')}
                    tone={b.checked ? 'bg-emerald-500' : 'bg-slate-300'} onClick={() => toggleBill(b)}
                    right={<div className="flex items-center gap-2.5"><div className="text-[14px] font-bold text-slate-900">{inr(b.total)}</div><Box on={b.checked} /></div>} />
                ))}
              </ListCard>
            ) : (
              <ListCard empty="No receipts in this range." testid="dc-rec-rcpt-list">
                {data.receipts.map((r) => (
                  <Row key={r.id} testid={'dc-rec-rcpt-' + r.id} title={(r.customer || 'Walk-in') + (r.bill_no ? ' · #' + r.bill_no : '')} sub={[niceDate(r.date), r.mode, r.staff].filter(Boolean).join(' · ')}
                    tone={r.checked ? 'bg-emerald-500' : 'bg-slate-300'} onClick={() => toggleRcpt(r)}
                    right={<div className="flex items-center gap-2.5"><div className="text-[14px] font-bold text-emerald-700">{inr(r.amount)}</div><Box on={r.checked} /></div>} />
                ))}
              </ListCard>
            )}
          </div>
        </>
      )}
    </>
  )
}

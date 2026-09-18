import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'
import { Hero, ModeBar, Stat, Section, ListCard, Row, PageHead, today, niceDate } from './bits.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const PRESETS = [
  ['today', 'Today', () => [today(), today()]],
  ['week', '7 days', () => [iso(new Date(Date.now() - 6 * 86400000)), today()]],
  ['month', 'This month', () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), today()] }],
  ['last', 'Last month', () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))] }],
]

export default function DcReports() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const [preset, setPreset] = useState('month')
  const [[frm, to], setRange] = useState(PRESETS[2][2]())
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.dcReports(frm, to).then(setR) }, [frm, to])
  const pick = (k, fn) => { setPreset(k); setRange(fn()) }
  const c = 'border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold bg-white'
  return (
    <>
      <PageHead title="Reports" sub={niceDate(frm) + ' → ' + niceDate(to)} />
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {PRESETS.map(([k, l, fn]) => <button key={k} data-testid={'dc-rep-' + k} onClick={() => pick(k, fn)} className={'text-[12.5px] font-semibold rounded-full px-3.5 py-1.5 border transition-colors ' + (preset === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>)}
        <input type="date" className={c} value={frm} onChange={(e) => { setPreset(''); setRange([e.target.value, to]) }} />
        <input type="date" className={c} value={to} onChange={(e) => { setPreset(''); setRange([frm, e.target.value]) }} />
      </div>
      {!r ? <Spin /> : (
        <>
          <Hero eyebrow="Collected" value={inr(r.totals.total || 0)} sub={(r.totals.bills || 0) + ' bills · avg ' + inr(r.totals.bills ? r.totals.total / r.totals.bills : 0) + ' / bill'} testid="dc-rep-hero">
            <ModeBar d={r.by_pay} dark />
          </Hero>
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            <Stat label="Expenses" v={inr(r.totals.expenses || 0)} tone="text-rose-600" />
            <Stat label="Pending" v={inr(r.totals.pending || 0)} tone="text-amber-600" />
            {admin ? <Stat label="Profit" v={inr(r.totals.profit || 0)} tone="text-emerald-600" sub={r.totals.total ? Math.round((r.totals.profit / r.totals.total) * 100) + '% margin' : ''} /> : <Stat label="Net cash" v={inr((r.by_pay.cash || 0) - (r.totals.expenses || 0))} />}
          </div>

          <Section title="Day-wise">
            <Bars rows={r.by_day} label={(d) => niceDate(d.date)} sub={(d) => d.bills + ' bills'} admin={admin} testid="dc-rep-days" empty="No bills in this range." />
          </Section>
          <Section title="Staff-wise">
            <Bars rows={r.by_staff} label={(s) => s.staff || '—'} sub={(s) => s.bills + ' bills'} admin={admin} testid="dc-rep-staff" empty="No staff data." />
          </Section>
          <Section title="Expenses by category">
            <ListCard empty="No expenses in this range.">
              {Object.entries(r.by_category).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <Row key={k} title={k || 'Other'} tone="bg-rose-500" right={<div className="text-[14px] font-bold text-rose-700">{inr(v)}</div>} />
              ))}
            </ListCard>
          </Section>
        </>
      )}
    </>
  )
}

function Bars({ rows, label, sub, admin, testid, empty }) {
  const max = Math.max(1, ...rows.map((x) => x.total))
  return (
    <div data-testid={testid} className="bg-white border border-slate-200/80 rounded-2xl shadow-soft p-4 space-y-3">
      {rows.length === 0 ? <div className="text-center text-[13px] text-slate-400 py-4">{empty}</div> : rows.map((x, i) => (
        <div key={i}>
          <div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold text-slate-700">{label(x)} <span className="text-slate-400 font-normal">· {sub(x)}</span></span><span className="font-bold text-slate-900">{inr(x.total)}{admin && <span className="text-emerald-600 font-semibold"> · {inr(x.profit)}</span>}</span></div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500" style={{ width: (x.total / max) * 100 + '%' }} /></div>
        </div>
      ))}
    </div>
  )
}

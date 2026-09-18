import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'

const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }
const today = () => new Date().toISOString().slice(0, 10)

export default function DcReports() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const [frm, setFrm] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.dcReports(frm, to).then(setR) }, [frm, to])
  const c = 'border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px]'
  return (
    <>
      <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Reports</h2>
      <div className="flex gap-2 mb-4">
        <input type="date" className={c} value={frm} onChange={(e) => setFrm(e.target.value)} />
        <input type="date" className={c} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {!r ? <Spin /> : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card label="Collected" v={inr(r.totals.total || 0)} sub={(r.totals.bills || 0) + ' bills'} />
            <Card label="Expenses" v={inr(r.totals.expenses || 0)} tone="text-red-600" />
            {admin ? <Card label="Profit" v={inr(r.totals.profit || 0)} tone="text-emerald-600" /> : <Card label="Pending" v={inr(r.totals.pending || 0)} tone="text-amber-600" />}
          </div>
          <Block title="Payment modes">
            {['cash', 'card', 'upi', 'finance', 'cheque'].map((k) => (
              <Line key={k} a={k.toUpperCase()} b={inr(r.by_pay[k] || 0)} />
            ))}
          </Block>
          <Block title="Staff-wise">
            {r.by_staff.length === 0 ? <Line a="No data" b="" /> : r.by_staff.map((s, i) => (
              <Line key={i} a={s.staff + ' · ' + s.bills + ' bills'} b={inr(s.total) + (admin ? ' · ' + inr(s.profit) : '')} />
            ))}
          </Block>
          <Block title="Day-wise">
            {r.by_day.length === 0 ? <Line a="No data" b="" /> : r.by_day.map((d, i) => (
              <Line key={i} a={d.date + ' · ' + d.bills + ' bills'} b={inr(d.total) + (admin ? ' · ' + inr(d.profit) : '')} />
            ))}
          </Block>
          <Block title="Expenses by category">
            {Object.keys(r.by_category).length === 0 ? <Line a="No expenses" b="" /> : Object.entries(r.by_category).map(([k, v]) => (
              <Line key={k} a={k} b={inr(v)} />
            ))}
          </Block>
        </>
      )}
    </>
  )
}

function Card({ label, v, sub, tone }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-2.5"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className={'font-display text-base font-bold mt-0.5 ' + (tone || 'text-slate-900')}>{v}</div>{sub && <div className="text-[10px] text-slate-400">{sub}</div>}</div>
}
function Block({ title, children }) {
  return <div className="bg-white border border-slate-200 rounded-2xl mb-3 overflow-hidden"><div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 px-4 pt-3 pb-1">{title}</div><div className="divide-y divide-slate-50">{children}</div></div>
}
function Line({ a, b }) {
  return <div className="flex justify-between px-4 py-2 text-[13px]"><span className="text-slate-600 truncate pr-2">{a}</span><span className="font-semibold text-slate-900 shrink-0">{b}</span></div>
}

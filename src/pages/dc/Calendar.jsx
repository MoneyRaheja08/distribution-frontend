import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'
import { Hero, Stat, Section, ListCard, Row, PageHead, ModeBar, today } from './bits.jsx'

const ym = (d) => d.toISOString().slice(0, 7)
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const SHADES = ['bg-slate-100 text-slate-400', 'bg-brand-100 text-brand-800', 'bg-brand-300 text-brand-900', 'bg-brand-500 text-white', 'bg-brand-700 text-white']

export default function Calendar() {
  const { auth } = useAuth()
  const nav = useNavigate()
  const [month, setMonth] = useState(ym(new Date()))
  const [r, setR] = useState(null)
  const [sel, setSel] = useState(null)
  useEffect(() => { if (auth.user.role !== 'admin') nav('/', { replace: true }) }, []) // eslint-disable-line
  useEffect(() => { setR(null); setSel(null); api.dcCalendar(month).then(setR) }, [month])
  const shift = (n) => { const [y, m] = month.split('-').map(Number); setMonth(ym(new Date(y, m - 1 + n, 15))) }
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1), daysIn = new Date(y, m, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const byDate = Object.fromEntries((r?.days || []).map((d) => [d.date, d]))
  const max = Math.max(1, ...(r?.days || []).map((d) => d.total))
  const shade = (t) => t <= 0 ? 0 : Math.min(4, 1 + Math.floor((t / max) * 3.999))
  const label = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const worked = r?.days.filter((d) => d.bills > 0).length || 0
  const day = sel ? byDate[sel] : null
  return (
    <>
      <PageHead title="Month view" sub="Daily collections heat-map · admin" right={
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-soft">
          <button data-testid="dc-cal-prev" onClick={() => shift(-1)} className="px-2.5 py-1 text-slate-500 hover:text-slate-900 font-bold">‹</button>
          <span className="text-[13px] font-semibold text-slate-800 w-32 text-center">{label}</span>
          <button data-testid="dc-cal-next" onClick={() => shift(1)} disabled={month >= ym(new Date())} className="px-2.5 py-1 text-slate-500 hover:text-slate-900 font-bold disabled:opacity-30">›</button>
        </div>} />
      {!r ? <Spin /> : (
        <>
          <Hero eyebrow={label} value={inr(r.total)} sub={r.bills + ' bills · ' + worked + ' active days · avg ' + inr(worked ? r.total / worked : 0) + ' / day'} testid="dc-cal-hero" />
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Stat label="Profit" v={inr(r.profit)} tone="text-emerald-600" sub={r.total ? Math.round((r.profit / r.total) * 100) + '% margin' : ''} />
            <Stat label="Best day" v={r.best ? new Date(r.best + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'} sub={r.best ? inr(byDate[r.best].total) : 'no bills yet'} />
          </div>

          <Section title="Heat-map" right={<div className="flex items-center gap-1 text-[10px] text-slate-400">low {SHADES.map((s, i) => <span key={i} className={'h-2.5 w-2.5 rounded-sm ' + s.split(' ')[0]} />)} high</div>}>
            <div data-testid="dc-cal-grid" className="bg-white border border-slate-200/80 rounded-2xl shadow-soft p-3">
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">{DOW.map((d) => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: lead }).map((_, i) => <div key={'l' + i} />)}
                {Array.from({ length: daysIn }).map((_, i) => {
                  const ds = month + '-' + String(i + 1).padStart(2, '0')
                  const d = byDate[ds]; const future = ds > today()
                  const s = SHADES[future ? 0 : shade(d?.total || 0)]
                  return (
                    <button key={ds} data-testid={'dc-cal-' + ds} disabled={future} onClick={() => setSel(ds)}
                      className={'aspect-square rounded-lg flex flex-col items-center justify-center transition-all ' + s + (future ? ' opacity-30' : ' hover:scale-105 active:scale-95') + (sel === ds ? ' ring-2 ring-offset-1 ring-slate-900' : '') + (ds === today() ? ' outline outline-1 outline-offset-1 outline-brand-500' : '')}>
                      <span className="text-[12px] font-bold leading-none">{i + 1}</span>
                      {d?.total > 0 && <span className="text-[8.5px] font-semibold leading-none mt-1 opacity-80">{d.total >= 100000 ? (d.total / 100000).toFixed(1) + 'L' : Math.round(d.total / 1000) + 'k'}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {sel && (
            <Section title={new Date(sel + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} right={<button onClick={() => nav('/collections')} className="text-[12px] font-semibold text-brand-700">Open bills</button>}>
              {!day ? <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-[13px] text-slate-400">No bills or expenses on this day.</div> : (
                <div className="grid grid-cols-3 gap-2.5">
                  <Stat label="Collected" v={inr(day.total)} sub={day.bills + ' bills'} />
                  <Stat label="Profit" v={inr(day.profit)} tone="text-emerald-600" />
                  <Stat label="Pending" v={inr(day.pending)} tone="text-amber-600" sub={day.expenses ? inr(day.expenses) + ' expenses' : ''} />
                </div>
              )}
            </Section>
          )}

          <Section title="Slow days (below average)">
            <ListCard empty="No slow days — every active day is at or above average.">
              {r.days.filter((d) => d.bills > 0 && d.total < r.total / Math.max(1, worked)).sort((a, b) => a.total - b.total).slice(0, 5).map((d) => (
                <Row key={d.date} title={new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} sub={d.bills + ' bills'} tone="bg-amber-400" onClick={() => setSel(d.date)} right={<div className="text-[14px] font-bold text-slate-900">{inr(d.total)}</div>} />
              ))}
            </ListCard>
          </Section>
        </>
      )}
    </>
  )
}

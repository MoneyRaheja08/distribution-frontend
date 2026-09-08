import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'

const fmtTime = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) } catch { return '' }
}

const AGE_TILES = [
  ['age_0_30', '0–30 days', 'from-brand-50 to-brand-50/40 border-brand-100 text-brand-700'],
  ['age_31_60', '31–60 days', 'from-amber-50 to-amber-50/40 border-amber-100 text-amber-700'],
  ['age_61_90', '61–90 days', 'from-orange-50 to-orange-50/40 border-orange-100 text-orange-700'],
  ['age_90p', '90+ days', 'from-red-50 to-red-50/40 border-red-100 text-red-700'],
]

function Stat({ label, value, tone = 'text-slate-900', sub }) {
  return (
    <div className="group relative bg-white border border-slate-200/70 rounded-2xl p-5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500/0 via-brand-500/60 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">{label}</div>
      <div className={'font-display text-3xl font-bold tracking-tight mt-1.5 ' + tone}>{value}</div>
      {sub && <div className="text-[12px] text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const nav = useNavigate()
  const [s, setS] = useState(null)
  const [visits, setVisits] = useState([])
  useEffect(() => { api.summary().then(setS); api.visitsToday().then(setVisits) }, [])
  if (!s) return <Spin />
  const ageing = s.ageing || {}

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight mb-5">Overview</h1>

      {s.pending_approvals > 0 && (
        <button onClick={() => nav('/approvals')} className="w-full mb-5 bg-gradient-to-r from-amber-50 to-amber-50/60 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-soft hover:-translate-y-0.5 transition-all">
          <div className="text-left">
            <div className="text-[15px] font-bold text-amber-800">{s.pending_approvals} payment{s.pending_approvals > 1 ? 's' : ''} awaiting approval</div>
            <div className="text-[12px] text-amber-700">Tap to review and approve</div>
          </div>
          <span className="text-amber-700 font-bold text-lg">›</span>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
        <Stat label="Total outstanding" value={inr(s.total_outstanding)} />
        <Stat label="Collected today" value={inr(s.collected_today)} tone="text-brand-700" />
        <Stat label="Cheques pending" value={inr(s.cheques_pending)} tone="text-amber-700" />
        <Stat label="Cash undeposited" value={inr(s.cash_undeposited)} tone="text-orange-700" />
      </div>

      <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">Ageing buckets</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
        {AGE_TILES.map(([k, label, cls]) => (
          <div key={k} className={'rounded-2xl border bg-gradient-to-br p-5 shadow-soft hover:-translate-y-0.5 transition-transform ' + cls}>
            <div className="text-[12px] font-semibold">{label}</div>
            <div className="font-display text-2xl font-bold tracking-tight mt-1">{inr(ageing[k] || 0)}</div>
          </div>
        ))}
      </div>

      {s.top_overdue && s.top_overdue.length > 0 && (
        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-soft mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-display text-[15px] font-bold text-slate-800">Top outstanding dealers</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="text-left px-5 py-2.5">Dealer</th>
                  <th className="text-left px-5 py-2.5 hidden sm:table-cell">Area</th>
                  <th className="text-right px-5 py-2.5">Outstanding</th>
                  <th className="text-right px-5 py-2.5">Oldest due</th>
                </tr>
              </thead>
              <tbody>
                {s.top_overdue.map((d) => (
                  <tr key={d.name} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">{d.name}</td>
                    <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{d.area || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{inr(d.outstanding)}</td>
                    <td className={'px-5 py-3 text-right font-semibold ' + (d.oldest_due > 90 ? 'text-red-600' : 'text-slate-500')}>{d.oldest_due}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">Collected today · by collector</h2>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft">
            {s.per_collector.length === 0 ? <div className="text-[12px] text-slate-400">No collectors yet.</div>
              : s.per_collector.map((c) => (
                <div key={c.id} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
                  <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{c.name}</span>{c.dealers} dealers</div>
                  <div className="font-bold text-brand-700">{inr(c.collected_today)}</div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">Visits today</h2>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft">
            {visits.length === 0 ? <div className="text-[12px] text-slate-400">No visits marked yet today.</div>
              : Object.entries(visits.reduce((acc, v) => { (acc[v.user_name] = acc[v.user_name] || []).push(v); return acc }, {})).map(([who, vs]) => (
                <div key={who} className="py-2 border-b border-slate-50 last:border-0">
                  <div className="text-[13px] font-semibold text-slate-800">{who} <span className="text-slate-400 font-normal">· {vs.length} visit{vs.length > 1 ? 's' : ''}</span></div>
                  <div className="mt-1 space-y-0.5">
                    {vs.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-[12px] text-slate-500">
                        <span className="truncate pr-2">{v.dealer_name}{v.lat && v.lng ? <a href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} target="_blank" rel="noreferrer" className="text-brand-700 font-semibold ml-1">📍 map</a> : ''}</span>
                        <span className="shrink-0 tabular-nums">{v.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {s.daily && s.daily.some((x) => x.amount > 0) && (
        <div className="mt-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">Daily collections · last 14 days</h2>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft"><Trend data={s.daily} /></div>
        </div>
      )}
    </>
  )
}

function Trend({ data }) {
  const max = Math.max(1, ...data.map((d) => d.amount))
  const W = 320, H = 90, n = data.length, gap = 3
  const bw = (W - gap * (n - 1)) / n
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const h = Math.round((d.amount / max) * H)
        const x = i * (bw + gap)
        return <g key={i}>
          <rect x={x} y={H - h} width={bw} height={h} rx="2" fill={d.amount > 0 ? '#0E7C66' : '#E2E8F0'} />
          {(i === 0 || i === n - 1 || i === Math.floor(n / 2)) && <text x={x + bw / 2} y={H + 12} fontSize="8" textAnchor="middle" fill="#94A3B8">{d.date.slice(5)}</text>}
        </g>
      })}
    </svg>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Card, Spin } from '../../components/ui.jsx'

const fmtTime = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  } catch { return '' }
}
import { useAuth } from '../../auth/AuthContext.jsx'

export default function Dashboard() {
  const { auth } = useAuth()
  const nav = useNavigate()
  const [s, setS] = useState(null)
  const [visits, setVisits] = useState([])
  useEffect(() => { api.summary().then(setS); api.visitsToday().then(setVisits) }, [])
  if (!s) return <Spin />

  const cards = [
    ['Total outstanding', inr(s.total_outstanding), ''],
    ['90+ days overdue', inr(s.over_90_days), 'text-red-700'],
    ['Collected today', inr(s.collected_today), 'text-emerald-700'],
    ['Cash undeposited', inr(s.cash_undeposited), 'text-amber-700'],
  ]

  return (
    <>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Overview</div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {cards.map(([l, n, tone]) => <Card key={l} n={n} l={l} tone={tone} />)}
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Card n={inr(s.collected_week || 0)} l="Collected · last 7 days" tone="text-emerald-700" />
        <Card n={inr(s.collected_month || 0)} l="Collected · this month" tone="text-emerald-700" />
      </div>

      {s.daily && s.daily.some((x) => x.amount > 0) && (
        <>
          <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Daily collections · last 14 days</div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <Trend data={s.daily} />
          </div>
        </>
      )}

      {s.top_overdue && s.top_overdue.length > 0 && (
        <>
          <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Top overdue dealers</div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            {s.top_overdue.map((d) => (
              <div key={d.name} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-[13px]">
                <div className="min-w-0"><div className="font-semibold text-slate-800 truncate">{d.name}</div>{d.age_90p > 0 && <div className="text-[11px] text-red-600">{inr(d.age_90p)} over 90 days</div>}</div>
                <div className="font-bold text-slate-900 shrink-0 pl-2">{inr(d.outstanding)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {s.pending_approvals > 0 && (
        <button onClick={() => nav('/approvals')} className="w-full mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-left">
            <div className="text-[14px] font-bold text-amber-800">{s.pending_approvals} payment{s.pending_approvals > 1 ? 's' : ''} awaiting approval</div>
            <div className="text-[11px] text-amber-700">Tap to review and approve</div>
          </div>
          <span className="text-amber-700 font-bold">›</span>
        </button>
      )}
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Collected today · by collector</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        {s.per_collector.length === 0 ? <div className="text-[12px] text-slate-400">No collectors yet.</div>
          : s.per_collector.map((c) => (
            <div key={c.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-[13px]">
              <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{c.name}</span>{c.dealers} dealers</div>
              <div className="font-bold text-emerald-700">{inr(c.collected_today)}</div>
            </div>
          ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-500">Cheques awaiting clearance</span>
          <span className="font-bold">{inr(s.cheques_pending)}</span>
        </div>
      </div>

      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Visits today</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        {visits.length === 0 ? <div className="text-[12px] text-slate-400">No visits marked yet today.</div> :
          Object.entries(visits.reduce((acc, v) => { (acc[v.user_name] = acc[v.user_name] || []).push(v); return acc }, {})).map(([who, vs]) => (
            <div key={who} className="py-2 border-b border-slate-100 last:border-0">
              <div className="text-[13px] font-semibold text-slate-800">{who} <span className="text-slate-400 font-normal">· {vs.length} visit{vs.length > 1 ? 's' : ''}</span></div>
              <div className="mt-1 space-y-0.5">
                {vs.map((v, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] text-slate-500">
                    <span className="truncate pr-2">{v.dealer_name}{v.lat && v.lng ? <a href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold ml-1">📍 map</a> : ''}</span>
                    <span className="shrink-0 tabular-nums">{v.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>


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
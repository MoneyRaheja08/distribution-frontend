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
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {cards.map(([l, n, tone]) => <Card key={l} n={n} l={l} tone={tone} />)}
      </div>

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
                {vs.slice().sort((a, b) => (a.first_ts || '').localeCompare(b.first_ts || '')).map((v, i) => (
                  <div key={i} className="flex justify-between text-[12px] text-slate-500">
                    <span className="truncate pr-2">{v.dealer_name}</span>
                    <span className="shrink-0 tabular-nums">{fmtTime(v.first_ts)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {auth.user.role === 'admin' && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => nav('/reports')} className="bg-emerald-700 text-white font-semibold py-3.5 rounded-xl">Reports</button>
          <button onClick={() => nav('/users')} className="bg-slate-900 text-white font-semibold py-3.5 rounded-xl">Manage users</button>
        </div>
      )}
    </>
  )
}

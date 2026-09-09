import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Store, Search } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Card, Pill, Spin, EmptyState } from '../../components/ui.jsx'

export default function Beat() {
  const [dealers, setDealers] = useState(null)
  const [q, setQ] = useState('')
  const nav = useNavigate()

  useEffect(() => { api.dealers().then(setDealers) }, [])
  if (!dealers) return <Spin />

  const total = dealers.reduce((s, d) => s + d.outstanding, 0)
  const shown = dealers.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()) || (d.area || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4 stagger">
        <Card n={inr(total)} l="My dealers' outstanding" />
        <Card n={dealers.length} l="My dealers" />
      </div>

      {dealers.length === 0 ? (
        <EmptyState icon={Store} title="No dealers on your beat yet" hint="Once your manager assigns dealers to you, they'll show up here sorted for your daily round." />
      ) : (
      <>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input data-testid="beat-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dealer or area…"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 text-base outline-none transition-colors focus:border-brand-500 text-slate-900 dark:text-slate-100" />
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">
        {q ? `${shown.length} match${shown.length === 1 ? '' : 'es'}` : 'My dealers · tap to collect'}
      </div>
      {shown.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-8 bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">No dealer matches "{q}".</div>
      ) : (
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 stagger">
        {shown.map((d) => {
          const over = d.outstanding > d.credit_limit
          const old = d.ageing.age_90p > 0
          return (
            <button key={d.id} onClick={() => nav('/dealer/' + d.id)}
              className="group w-full text-left bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex justify-between items-center shadow-soft hover:shadow-lift hover:-translate-y-0.5 active:bg-slate-50 dark:active:bg-slate-800 transition-all">
              <div className="min-w-0 pr-2">
                <div className="text-[15px] font-semibold truncate text-slate-900 dark:text-slate-100">{d.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{d.area}{d.visited_today ? ' \u00b7 visited \u2713' : ''}</div>
                {d.outstanding === 0 ? <Pill tone="ok">Clear</Pill>
                  : over ? <Pill tone="over">Over limit</Pill>
                  : old ? <Pill tone="old">{inr(d.ageing.age_90p)} · 90+ days</Pill> : null}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={'font-display text-[16px] font-bold tracking-tight ' + (d.outstanding === 0 ? 'text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100')}>{inr(d.outstanding)}</div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          )
        })}
      </div>
      )}
      </>
      )}
    </>
  )
}

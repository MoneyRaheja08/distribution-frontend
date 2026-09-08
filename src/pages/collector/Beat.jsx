import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Store } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Card, Pill, Spin, EmptyState } from '../../components/ui.jsx'

export default function Beat() {
  const [dealers, setDealers] = useState(null)
  const nav = useNavigate()

  useEffect(() => { api.dealers().then(setDealers) }, [])
  if (!dealers) return <Spin />

  const total = dealers.reduce((s, d) => s + d.outstanding, 0)

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4 stagger">
        <Card n={inr(total)} l="My dealers' outstanding" />
        <Card n={dealers.length} l="My dealers" />
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">My dealers · tap to collect</div>
      {dealers.length === 0 ? (
        <EmptyState icon={Store} title="No dealers on your beat yet" hint="Once your manager assigns dealers to you, they'll show up here sorted for your daily round." />
      ) : (
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 stagger">
        {dealers.map((d) => {
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
  )
}

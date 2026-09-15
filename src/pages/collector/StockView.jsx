import { useEffect, useState } from 'react'
import { Package, Search } from 'lucide-react'
import { api } from '../../api/client.js'
import { Spin, EmptyState } from '../../components/ui.jsx'

export default function StockView() {
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { api.stockSummary().then(setData) }, [])
  if (!data) return <Spin />
  const n = q.trim().toLowerCase()
  const rows = (data.rows || []).filter((r) => !n || (r.model || '').toLowerCase().includes(n) || (r.brand || '').toLowerCase().includes(n))
  const totalAvail = (data.rows || []).reduce((s, r) => s + (r.available || 0), 0)
  return (
    <>
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Available stock</div>
        <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{totalAvail} in stock</div>
      </div>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input data-testid="collector-stock-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model or brand…"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 text-base outline-none focus:border-brand-500 transition-colors" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Package} title="No stock to show" hint="Stock imported by the office appears here so you can quote availability on the spot." />
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {rows.map((s, i) => {
            const c = s.available <= 0 ? 'text-red-700 dark:text-red-400' : s.available <= 8 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
            const tag = s.available <= 0 ? 'Out' : s.available <= 8 ? 'Low' : 'In stock'
            return (
              <div key={i} data-testid={'collector-stock-' + i} className="bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex justify-between items-center shadow-soft">
                <div className="min-w-0 pr-2">
                  <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">{s.model}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.brand}{s.group ? ' · ' + s.group : ''}</div>
                </div>
                <div className={'text-right shrink-0 ' + c}><div className="font-display text-base font-bold">{s.available}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{tag}</div></div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

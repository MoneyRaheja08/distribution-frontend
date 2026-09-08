import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, EmptyState } from '../../components/ui.jsx'

export default function StockView() {
  const [stock, setStock] = useState(null)
  useEffect(() => { api.stock().then(setStock) }, [])
  if (!stock) return <Spin />
  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">Godown stock</div>
      {stock.length === 0 ? (
        <EmptyState icon={Package} title="No stock listed yet" hint="Stock added by the office will appear here so you can quote availability on the spot." />
      ) : (
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {stock.map((s) => {
          const c = s.qty === 0 ? 'text-red-700 dark:text-red-400' : s.qty <= 8 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
          const tag = s.qty === 0 ? 'Out' : s.qty <= 8 ? 'Low' : 'In stock'
          return (
            <div key={s.id} className="bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex justify-between items-center shadow-soft">
              <div>
                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dealer price {inr(s.price)}</div>
              </div>
              <div className={'text-right ' + c}><div className="font-display text-base font-bold">{s.qty}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{tag}</div></div>
            </div>
          )
        })}
      </div>
      )}
    </>
  )
}

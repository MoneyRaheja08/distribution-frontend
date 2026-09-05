import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'

export default function StockView() {
  const [stock, setStock] = useState(null)
  useEffect(() => { api.stock().then(setStock) }, [])
  if (!stock) return <Spin />
  return (
    <>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Godown stock</div>
      {stock.length === 0 && <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">No stock listed yet.</div>}
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {stock.map((s) => {
          const c = s.qty === 0 ? 'text-red-700' : s.qty <= 8 ? 'text-amber-700' : ''
          const tag = s.qty === 0 ? 'Out' : s.qty <= 8 ? 'Low' : 'In stock'
          return (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <div className="text-[14px] font-semibold">{s.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Dealer price {inr(s.price)}</div>
              </div>
              <div className={'text-right ' + c}><div className="text-base font-extrabold">{s.qty}</div><div className="text-[10px] text-slate-500">{tag}</div></div>
            </div>
          )
        })}
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, Empty } from '../../components/ui.jsx'

export default function Money() {
  const [pays, setPays] = useState(null)
  const reload = () => api.payments().then(setPays)
  useEffect(() => { reload() }, [])
  if (!pays) return <Spin />

  const cashByCollector = {}
  pays.filter((p) => p.mode === 'Cash' && !p.deposited && p.status === 'cleared').forEach((p) => {
    cashByCollector[p.collector_id] = cashByCollector[p.collector_id] || { id: p.collector_id, name: p.collector_name, amt: 0 }
    cashByCollector[p.collector_id].amt += p.amount
  })
  const cashRows = Object.values(cashByCollector)
  const cheques = pays.filter((p) => p.status === 'pending')

  const deposit = async (cid) => { await api.deposit(cid); reload() }
  const chq = async (id, ok) => { await api.cheque(id, ok); reload() }

  return (
    <>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Cash in hand · mark when deposited</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        {cashRows.length === 0 ? <Empty>No undeposited cash.</Empty> : cashRows.map((c) => (
          <div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-[13px]">
            <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{c.name}</span>cash in hand</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{inr(c.amt)}</span>
              <button onClick={() => deposit(c.id)} className="text-[11px] font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1">Received</button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Cheques pending clearance</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        {cheques.length === 0 ? <Empty>No cheques pending.</Empty> : cheques.map((p) => (
          <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 text-[13px]">
            <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{p.dealer_name}</span>{p.cheque || 'cheque'} · {inr(p.amount)}</div>
            <div className="flex gap-1.5">
              <button onClick={() => chq(p.id, true)} className="text-[11px] font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center gap-1"><Check size={12} />Cleared</button>
              <button onClick={() => chq(p.id, false)} className="text-[11px] font-semibold text-red-700 border border-red-200 rounded-lg px-2.5 py-1 flex items-center gap-1"><X size={12} />Bounced</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

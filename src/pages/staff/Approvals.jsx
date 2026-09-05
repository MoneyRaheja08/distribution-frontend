import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, BackBtn, Empty } from '../../components/ui.jsx'

export default function Approvals() {
  const [items, setItems] = useState(null)
  const load = () => api.pendingPayments().then(setItems)
  useEffect(() => { load() }, [])
  if (!items) return <Spin />

  const act = async (id, approved) => { await api.approvePayment(id, approved); load() }

  return (
    <>
      <BackBtn label="Overview" />
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Payments awaiting approval</div>
      {items.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">Nothing to approve right now.</div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {items.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">{p.dealer_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.mode}{p.cheque ? ' · ' + p.cheque : ''} · by {p.collector_name} · {p.date}</div>
                </div>
                <div className="text-[15px] font-bold text-emerald-700 shrink-0">{inr(p.amount)}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => act(p.id, true)} className="flex-1 bg-emerald-700 text-white text-[13px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1"><Check size={14} />Approve</button>
                <button onClick={() => act(p.id, false)} className="flex-1 border border-red-200 text-red-700 text-[13px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1"><X size={14} />Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

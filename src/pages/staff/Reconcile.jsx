import { useEffect, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'

export default function Reconcile() {
  const [tab, setTab] = useState('todo')   // 'todo' | 'done'
  const [items, setItems] = useState(null)
  const load = () => { setItems(null); api.collections(tab === 'done').then(setItems) }
  useEffect(() => { load() }, [tab])

  const set = async (id, reconciled) => { await api.reconcilePayment(id, reconciled); load() }

  return (
    <>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Collections · reconcile</div>
      <div className="flex gap-2 mb-3 bg-slate-200 p-1 rounded-xl max-w-xs">
        {[['todo', 'To reconcile'], ['done', 'Reconciled']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={'flex-1 py-2 rounded-lg text-[13px] font-semibold ' + (tab === k ? 'bg-white text-slate-900 shadow' : 'text-slate-500')}>{l}</button>
        ))}
      </div>

      {!items ? <Spin /> : items.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">
          {tab === 'todo' ? 'Nothing left to reconcile.' : 'No reconciled payments yet.'}
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {items.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">{p.dealer_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.mode}{p.cheque ? ' · ' + p.cheque : ''}{p.status === 'pending' ? ' · cheque pending' : ''} · {p.date}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    by {p.collector_name}{p.approved_by ? ' · approved: ' + p.approved_by : ''}
                  </div>
                </div>
                <div className="text-[15px] font-bold text-emerald-700 shrink-0">{inr(p.amount)}</div>
              </div>
              <div className="mt-3">
                {tab === 'todo' ? (
                  <button onClick={() => set(p.id, true)} className="w-full bg-slate-900 text-white text-[13px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1">
                    <Check size={14} />Mark reconciled
                  </button>
                ) : (
                  <button onClick={() => set(p.id, false)} className="w-full border border-slate-200 text-slate-600 text-[13px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1">
                    <RotateCcw size={13} />Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

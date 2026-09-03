import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr, outstanding, AGE_LABELS } from '../../lib/format.js'
import { Spin, BackBtn } from '../../components/ui.jsx'

export default function Dealer() {
  const { id } = useParams()
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [ledger, setLedger] = useState([])

  useEffect(() => {
    api.dealer(id).then(setD)
    api.payments('?dealer_id=' + id).then(setLedger)
  }, [id])
  if (!d) return <Spin />

  const o = outstanding(d)
  const over = o > d.credit_limit
  const pct = d.credit_limit > 0 ? Math.min(100, (o / d.credit_limit) * 100) : 0

  return (
    <>
      <BackBtn label="Beat" />
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="text-lg font-bold">{d.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{d.area}</div>
          </div>
          <a href={'tel:' + (d.phone || '')} className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-1">
            <Phone size={13} />Call
          </a>
        </div>
        <div className="h-2 rounded bg-slate-200 overflow-hidden mt-3 mb-1">
          <div className={'h-full ' + (over ? 'bg-red-600' : 'bg-emerald-600')} style={{ width: pct + '%' }} />
        </div>
        <div className="text-[11px] text-slate-500">
          {inr(o)} of {inr(d.credit_limit)} limit
          {over && <span className="text-red-700 font-semibold"> · OVER LIMIT — hold supply</span>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <div className="text-xs font-bold text-slate-600 mb-2.5">Outstanding by age</div>
        <div className="grid grid-cols-4 gap-1.5">
          {AGE_LABELS.map(([k, l]) => (
            <div key={k} className="bg-slate-100 rounded-lg py-2.5 text-center">
              <div className={'text-[13px] font-bold ' + (k === 'age_90p' && d.ageing[k] > 0 ? 'text-red-700' : '')}>
                {d.ageing[k] ? (d.ageing[k] / 1000).toFixed(0) + 'k' : '—'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">{l} days</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <div className="text-xs font-bold text-slate-600 mb-1">Recent payments</div>
        {ledger.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-1">No payments yet.</div>
        ) : ledger.map((p) => (
          <div key={p.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-[13px]">
            <div className="text-slate-500">
              <span className="text-slate-900 font-semibold block">{p.mode}{p.status === 'pending' ? ' · pending' : p.status === 'bounced' ? ' · bounced' : ''}</span>
              {p.date} · R-{p.receipt}
            </div>
            <div className={'font-bold ' + (p.status !== 'bounced' ? 'text-emerald-700' : 'text-slate-400')}>
              {p.status === 'bounced' ? '' : '−'}{inr(p.amount)}
            </div>
          </div>
        ))}
      </div>

      {o > 0 && (
        <button onClick={() => nav('/collect/' + d.id)} className="w-full bg-emerald-700 text-white font-semibold py-3.5 rounded-xl">
          Record collection
        </button>
      )}
    </>
  )
}

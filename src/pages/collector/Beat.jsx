import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Card, Pill, Spin } from '../../components/ui.jsx'

export default function Beat() {
  const [dealers, setDealers] = useState(null)
  const nav = useNavigate()

  useEffect(() => { api.dealers().then(setDealers) }, [])
  if (!dealers) return <Spin />

  const total = dealers.reduce((s, d) => s + d.outstanding, 0)

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Card n={inr(total)} l="My dealers' outstanding" />
        <Card n={dealers.length} l="My dealers" />
      </div>
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">My dealers · tap to collect</div>
      <div className="space-y-2">
        {dealers.map((d) => {
          const over = d.outstanding > d.credit_limit
          const old = d.ageing.age_90p > 0
          return (
            <button key={d.id} onClick={() => nav('/dealer/' + d.id)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-center active:bg-slate-50">
              <div>
                <div className="text-[15px] font-semibold">{d.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{d.area}</div>
                {d.outstanding === 0 ? <Pill tone="ok">Clear</Pill>
                  : over ? <Pill tone="over">Over limit</Pill>
                  : old ? <Pill tone="old">{inr(d.ageing.age_90p)} · 90+ days</Pill> : null}
              </div>
              <div className={'text-[15px] font-bold ' + (d.outstanding === 0 ? 'text-emerald-700' : '')}>{inr(d.outstanding)}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}

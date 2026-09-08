import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function MyDay() {
  const { auth } = useAuth()
  const [pays, setPays] = useState(null)
  useEffect(() => { api.payments().then(setPays) }, [])
  if (!pays) return <Spin />

  const mine = pays.filter((p) => p.collector_id === auth.user.id && p.date === 'today')
  const collected = mine.filter((p) => p.status !== 'bounced').reduce((s, p) => s + p.amount, 0)
  const cash = mine.filter((p) => p.mode === 'Cash' && !p.deposited && p.status === 'cleared').reduce((s, p) => s + p.amount, 0)

  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">My day</div>
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 shadow-soft">
        <Row k="Collected today" v={inr(collected)} tone="text-brand-700 dark:text-brand-400" />
        <Row k="Cash in hand to deposit" v={inr(cash)} />
        <Row k="Receipts issued today" v={mine.length} />
        <Row k="Dealers visited today" v={new Set(mine.map((p) => p.dealer_id)).size} last />
      </div>
      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2.5 mt-3">
        Deposit your cash and have the manager mark it received — undeposited cash stays against your name.
      </div>
    </>
  )
}

function Row({ k, v, tone = '', last }) {
  return (
    <div className={'flex justify-between py-2 text-[13px] ' + (last ? '' : 'border-b border-slate-100 dark:border-slate-800')}>
      <span className="text-slate-500 dark:text-slate-400">{k}</span>
      <span className={'font-bold text-slate-900 dark:text-slate-100 ' + tone}>{v}</span>
    </div>
  )
}

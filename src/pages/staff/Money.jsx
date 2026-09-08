import { useEffect, useState } from 'react'
import { Check, X, Wallet, Banknote, FileClock, ClipboardCheck } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin, Empty, EmptyState } from '../../components/ui.jsx'

function Stat({ label, value, tone = 'text-slate-900', icon: Icon }) {
  return (
    <div className="relative bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">{label}</div>
        {Icon && <Icon size={15} className="text-slate-300" />}
      </div>
      <div className={'font-display text-2xl font-bold tracking-tight mt-1.5 ' + tone}>{value}</div>
    </div>
  )
}

export default function Money() {
  const [s, setS] = useState(null)
  const [pays, setPays] = useState(null)
  const [received, setReceived] = useState(null)
  const todayIso = new Date().toLocaleDateString('en-CA')  // YYYY-MM-DD (local)
  const [day, setDay] = useState(todayIso)

  const loadCore = () => { api.summary().then(setS); api.payments().then(setPays) }
  const loadDay = (d) => { setReceived(null); api.payments('?day=' + d).then((list) => setReceived(list.filter((p) => p.status !== 'bounced'))) }
  useEffect(() => { loadCore() }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadDay(day) }, [day])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!pays || !s) return <Spin />

  const cashByCollector = {}
  pays.filter((p) => p.mode === 'Cash' && !p.deposited && p.status === 'cleared').forEach((p) => {
    cashByCollector[p.collector_id] = cashByCollector[p.collector_id] || { id: p.collector_id, name: p.collector_name, amt: 0 }
    cashByCollector[p.collector_id].amt += p.amount
  })
  const cashRows = Object.values(cashByCollector)
  const cheques = pays.filter((p) => p.status === 'pending')

  const rec = received || []
  const receivedTotal = rec.reduce((sum, p) => sum + p.amount, 0)
  const reconcilable = rec.filter((p) => p.status !== 'pending')
  const doneCount = reconcilable.filter((p) => p.reconciled).length
  const pct = reconcilable.length ? Math.round((doneCount / reconcilable.length) * 100) : 0
  const isToday = day === todayIso

  const deposit = async (cid) => { await api.deposit(cid); loadCore(); loadDay(day); toast.success('Marked deposited') }
  const chq = async (id, ok) => { await api.cheque(id, ok); loadCore(); loadDay(day); toast.success(ok ? 'Cheque cleared' : 'Cheque bounced') }
  const reconcile = async (id) => {
    await api.reconcilePayment(id, true)
    setReceived((list) => list.map((p) => (p.id === id ? { ...p, reconciled: true } : p)))
    toast.success('Reconciled')
  }

  const chipTone = (p) => p.status === 'pending' ? 'text-amber-700 bg-amber-50 ring-amber-100'
    : p.reconciled ? 'text-slate-500 bg-slate-100 ring-slate-200' : 'text-brand-700 bg-brand-50 ring-brand-100'

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight mb-5">Money</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
        <Stat label="Collected today" value={inr(s.collected_today)} tone="text-brand-700" icon={Wallet} />
        <Stat label="Cash undeposited" value={inr(s.cash_undeposited)} tone="text-orange-700" icon={Banknote} />
        <Stat label="Cheques pending" value={inr(s.cheques_pending)} tone="text-amber-700" icon={FileClock} />
        <Stat label="Total outstanding" value={inr(s.total_outstanding)} icon={ClipboardCheck} />
      </div>

      {/* Received on a day — reconcile inline */}
      <div className="flex items-center justify-between mb-2.5 px-0.5 gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Payments received {isToday ? 'today' : 'on'}</div>
        <input type="date" value={day} max={todayIso} data-testid="money-day-picker" onChange={(e) => setDay(e.target.value || todayIso)}
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 bg-white outline-none focus:border-brand-500" />
      </div>

      {received === null ? <Spin /> : rec.length === 0 ? (
        <EmptyState icon={Wallet} title={isToday ? 'No payments received today yet' : 'No payments on this day'} hint="As collectors record collections, they land here for you to check off and reconcile." />
      ) : (
        <>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3.5 mb-3 shadow-soft">
            <div className="flex justify-between items-center text-[12px] mb-2">
              <span className="font-semibold text-slate-600">{rec.length} received · <span className="text-brand-700">{inr(receivedTotal)}</span></span>
              <span data-testid="reconcile-progress" className="font-semibold text-slate-500">{doneCount} of {reconcilable.length} reconciled</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={'h-full transition-all ' + (pct === 100 ? 'bg-brand-600' : 'bg-brand-500')} style={{ width: pct + '%' }} />
            </div>
            {reconcilable.length > 0 && pct === 100 && <div className="text-[11px] font-semibold text-brand-700 mt-1.5">All squared off for the day ✓</div>}
          </div>
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 mb-6">
            {rec.map((p) => (
              <div key={p.id} data-testid={'received-payment-' + p.id} className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold truncate text-slate-900">{p.dealer_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">by {p.collector_name}{p.receipt ? ' · R-' + p.receipt : ''}</div>
                    <span className={'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 mt-1.5 ' + chipTone(p)}>
                      {p.reconciled ? 'Reconciled ✓' : p.status === 'pending' ? 'Cheque pending' : p.mode}{p.cheque ? ' · ' + p.cheque : ''}
                    </span>
                  </div>
                  <div className="font-display text-[16px] font-bold tracking-tight text-slate-900 shrink-0">{inr(p.amount)}</div>
                </div>
                {!p.reconciled && p.status !== 'pending' && (
                  <button onClick={() => reconcile(p.id)} data-testid={'reconcile-btn-' + p.id}
                    className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                    <Check size={14} />Mark reconciled
                  </button>
                )}
                {p.status === 'pending' && (
                  <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Reconcile once the cheque clears (below).</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cash in hand */}
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2.5 px-0.5">Cash in hand · mark when deposited</div>
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 mb-6 shadow-soft">
        {cashRows.length === 0 ? <Empty>No undeposited cash.</Empty> : cashRows.map((c) => (
          <div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-[13px]">
            <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{c.name}</span>cash in hand</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{inr(c.amt)}</span>
              <button onClick={() => deposit(c.id)} className="text-[11px] font-semibold text-brand-700 bg-brand-50 ring-1 ring-brand-100 hover:bg-brand-100 rounded-lg px-2.5 py-1 transition-colors">Received</button>
            </div>
          </div>
        ))}
      </div>

      {/* Cheques pending */}
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2.5 px-0.5">Cheques pending clearance</div>
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft">
        {cheques.length === 0 ? <Empty>No cheques pending.</Empty> : cheques.map((p) => (
          <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 text-[13px]">
            <div className="text-slate-500"><span className="text-slate-900 font-semibold block">{p.dealer_name}</span>{p.cheque || 'cheque'} · {inr(p.amount)}</div>
            <div className="flex gap-1.5">
              <button onClick={() => chq(p.id, true)} className="text-[11px] font-semibold text-brand-700 bg-brand-50 ring-1 ring-brand-100 hover:bg-brand-100 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><Check size={12} />Cleared</button>
              <button onClick={() => chq(p.id, false)} className="text-[11px] font-semibold text-red-700 bg-red-50 ring-1 ring-red-100 hover:bg-red-100 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><X size={12} />Bounced</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

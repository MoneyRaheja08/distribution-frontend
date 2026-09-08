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
  const [today, setToday] = useState(null)
  const todayIso = new Date().toLocaleDateString('en-CA')  // YYYY-MM-DD (local)
  const reload = () => {
    api.summary().then(setS)
    api.payments().then(setPays)
    api.payments('?day=' + todayIso).then(setToday)
  }
  useEffect(() => { reload() }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!pays || !s || !today) return <Spin />

  const cashByCollector = {}
  pays.filter((p) => p.mode === 'Cash' && !p.deposited && p.status === 'cleared').forEach((p) => {
    cashByCollector[p.collector_id] = cashByCollector[p.collector_id] || { id: p.collector_id, name: p.collector_name, amt: 0 }
    cashByCollector[p.collector_id].amt += p.amount
  })
  const cashRows = Object.values(cashByCollector)
  const cheques = pays.filter((p) => p.status === 'pending')
  const received = [...today].filter((p) => p.status !== 'bounced')
  const receivedTotal = received.reduce((sum, p) => sum + p.amount, 0)

  const deposit = async (cid) => { await api.deposit(cid); reload(); toast.success('Marked deposited') }
  const chq = async (id, ok) => { await api.cheque(id, ok); reload(); toast.success(ok ? 'Cheque cleared' : 'Cheque bounced') }
  const reconcile = async (id) => {
    await api.reconcilePayment(id, true)
    setToday((list) => list.map((p) => (p.id === id ? { ...p, reconciled: true } : p)))
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

      {/* Received today — reconcile inline */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Received today · reconcile</div>
        <div className="text-[12px] font-semibold text-slate-500">{received.length} · <span className="text-brand-700">{inr(receivedTotal)}</span></div>
      </div>
      <div className="mb-6">
        {received.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments received today yet" hint="As collectors record collections through the day, they land here for you to check off and reconcile." />
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {received.map((p) => (
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
        )}
      </div>

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

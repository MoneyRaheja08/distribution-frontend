import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Check } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr, outstanding } from '../../lib/format.js'
import { Spin, BackBtn, Field } from '../../components/ui.jsx'

export default function Collect() {
  const { id } = useParams()
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [amt, setAmt] = useState('')
  const [mode, setMode] = useState('Cash')
  const [cheque, setCheque] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => { api.dealer(id).then(setD) }, [id])
  if (!d) return <Spin />

  const o = outstanding(d)

  const save = async () => {
    const a = parseInt(amt || 0)
    if (!a || a <= 0) return setErr('Enter an amount')
    if (a > o) return setErr('Amount exceeds outstanding of ' + inr(o))
    if (mode === 'Cheque' && !cheque.trim()) return setErr('Enter cheque number and bank')
    setBusy(true); setErr('')
    try {
      const rc = await api.collect({ dealer_id: d.id, amount: a, mode, cheque, cheque_date: mode === 'Cheque' ? chequeDate || null : null })
      setReceipt(rc)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (receipt) {
    const needsApproval = receipt.approved === false
    return (
      <>
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center shadow-soft animate-scale-in">
          <div className={'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ' + (needsApproval ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-4 ring-amber-100 dark:ring-amber-500/20' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-4 ring-brand-100 dark:ring-brand-500/20')}><Check size={28} /></div>
          <div className={'font-display text-3xl font-bold ' + (needsApproval ? 'text-amber-700 dark:text-amber-300' : 'text-brand-700 dark:text-brand-400')}>{inr(receipt.amount)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{needsApproval ? 'Sent for approval' : 'Receipt R-' + receipt.receipt + (receipt.status === 'pending' ? ' · cheque pending clearance' : '')}</div>
          <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-4 text-left border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
            <div className="flex justify-between"><span>Dealer</span><span className="font-semibold text-slate-800 dark:text-slate-200">{d.name}</span></div>
            <div className="flex justify-between"><span>Mode</span><span className="font-semibold text-slate-800 dark:text-slate-200">{receipt.mode}{receipt.cheque ? ' · ' + receipt.cheque : ''}</span></div>
            {!needsApproval && <div className="flex justify-between"><span>New outstanding</span><span className="font-semibold text-slate-800 dark:text-slate-200">{inr(receipt.new_outstanding)}</span></div>}
            {needsApproval && <div className="flex justify-between"><span>Status</span><span className="font-semibold text-amber-700 dark:text-amber-300">Awaiting manager/admin approval</span></div>}
          </div>
        </div>
        <button onClick={() => nav('/')} className="w-full mt-4 bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3.5 rounded-xl shadow-glow transition-all">Done</button>
      </>
    )
  }

  return (
    <>
      <BackBtn label="Cancel" />
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5">Record collection — {d.name}</div>
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-soft">
        <Field label="Amount received" value={amt} onChange={setAmt} type="number" placeholder="₹" big />
        <div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mode</div>
          <div className="flex gap-2">
            {['Cash', 'Cheque', 'UPI'].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={'flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ' +
                  (mode === m ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-soft' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300')}>{m}</button>
            ))}
          </div>
        </div>
        {mode === 'Cheque' && <Field label="Cheque no. & bank" value={cheque} onChange={setCheque} placeholder="004521 · PNB" />}
        {mode === 'Cheque' && <div><Field label="Cheque date (leave blank if today)" value={chequeDate} onChange={setChequeDate} type="date" /><div className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">Post-dated cheque? Enter the date written on it — it can only be cleared on or after that day.</div></div>}
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Applied to oldest dues first. Cheques stay pending until cleared.</div>
        {err && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2 animate-fade-in">{err}</div>}
        <button onClick={save} disabled={busy}
          className="w-full bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 transition-all">
          {busy && <Loader2 size={16} className="animate-spin" />} Save &amp; generate receipt
        </button>
      </div>
    </>
  )
}

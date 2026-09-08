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
      const rc = await api.collect({ dealer_id: d.id, amount: a, mode, cheque })
      setReceipt(rc)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (receipt) {
    const needsApproval = receipt.approved === false
    return (
      <>
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center shadow-soft animate-scale-in">
          <div className={'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ' + (needsApproval ? 'bg-amber-50 text-amber-700 ring-4 ring-amber-100' : 'bg-brand-50 text-brand-700 ring-4 ring-brand-100')}><Check size={28} /></div>
          <div className={'font-display text-3xl font-bold ' + (needsApproval ? 'text-amber-700' : 'text-brand-700')}>{inr(receipt.amount)}</div>
          <div className="text-xs text-slate-500 mt-1">{needsApproval ? 'Sent for approval' : 'Receipt R-' + receipt.receipt + (receipt.status === 'pending' ? ' · cheque pending clearance' : '')}</div>
          <div className="text-[12.5px] text-slate-500 mt-4 text-left border-t border-slate-100 pt-3 space-y-1">
            <div className="flex justify-between"><span>Dealer</span><span className="font-semibold text-slate-800">{d.name}</span></div>
            <div className="flex justify-between"><span>Mode</span><span className="font-semibold text-slate-800">{receipt.mode}{receipt.cheque ? ' · ' + receipt.cheque : ''}</span></div>
            {!needsApproval && <div className="flex justify-between"><span>New outstanding</span><span className="font-semibold text-slate-800">{inr(receipt.new_outstanding)}</span></div>}
            {needsApproval && <div className="flex justify-between"><span>Status</span><span className="font-semibold text-amber-700">Awaiting manager/admin approval</span></div>}
          </div>
        </div>
        <button onClick={() => nav('/')} className="w-full mt-4 bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3.5 rounded-xl shadow-glow transition-all">Done</button>
      </>
    )
  }

  return (
    <>
      <BackBtn label="Cancel" />
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2.5">Record collection — {d.name}</div>
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 space-y-4 shadow-soft">
        <Field label="Amount received" value={amt} onChange={setAmt} type="number" placeholder="₹" big />
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1.5">Mode</div>
          <div className="flex gap-2">
            {['Cash', 'Cheque', 'UPI'].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={'flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ' +
                  (mode === m ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-soft' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300')}>{m}</button>
            ))}
          </div>
        </div>
        {mode === 'Cheque' && <Field label="Cheque no. & bank" value={cheque} onChange={setCheque} placeholder="004521 · PNB" />}
        <div className="text-[11px] text-slate-500">Applied to oldest dues first. Cheques stay pending until cleared.</div>
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-fade-in">{err}</div>}
        <button onClick={save} disabled={busy}
          className="w-full bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 transition-all">
          {busy && <Loader2 size={16} className="animate-spin" />} Save &amp; generate receipt
        </button>
      </div>
    </>
  )
}

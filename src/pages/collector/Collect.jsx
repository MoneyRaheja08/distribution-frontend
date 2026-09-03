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
    return (
      <>
        <div className="bg-white border border-dashed border-slate-500 rounded-xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3"><Check size={28} /></div>
          <div className="text-3xl font-extrabold text-emerald-700">{inr(receipt.amount)}</div>
          <div className="text-xs text-slate-500 mt-1">Receipt R-{receipt.receipt}{receipt.status === 'pending' ? ' · cheque pending clearance' : ''}</div>
          <div className="text-[12.5px] text-slate-500 mt-4 text-left border-t border-slate-100 pt-3 space-y-1">
            <div className="flex justify-between"><span>Dealer</span><span className="font-semibold text-slate-800">{d.name}</span></div>
            <div className="flex justify-between"><span>Mode</span><span className="font-semibold text-slate-800">{receipt.mode}{receipt.cheque ? ' · ' + receipt.cheque : ''}</span></div>
            <div className="flex justify-between"><span>New outstanding</span><span className="font-semibold text-slate-800">{inr(receipt.new_outstanding)}</span></div>
          </div>
        </div>
        <button onClick={() => nav('/')} className="w-full mt-4 bg-emerald-700 text-white font-semibold py-3.5 rounded-xl">Done</button>
      </>
    )
  }

  return (
    <>
      <BackBtn label="Cancel" />
      <div className="text-xs font-bold text-slate-600 mb-2.5">Record collection — {d.name}</div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <Field label="Amount received" value={amt} onChange={setAmt} type="number" placeholder="₹" big />
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1.5">Mode</div>
          <div className="flex gap-2">
            {['Cash', 'Cheque', 'UPI'].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={'flex-1 py-2.5 rounded-lg text-[13px] font-semibold border ' +
                  (mode === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{m}</button>
            ))}
          </div>
        </div>
        {mode === 'Cheque' && <Field label="Cheque no. & bank" value={cheque} onChange={setCheque} placeholder="004521 · PNB" />}
        <div className="text-[11px] text-slate-500">Applied to oldest dues first. Cheques stay pending until cleared.</div>
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <button onClick={save} disabled={busy}
          className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />} Save &amp; generate receipt
        </button>
      </div>
    </>
  )
}

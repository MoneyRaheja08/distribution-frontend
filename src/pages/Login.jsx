import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true); setErr('')
    try { await login(name.trim(), pin) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-300 flex justify-center p-3 font-sans">
      <div className="w-full max-w-md bg-slate-100 rounded-3xl shadow-2xl min-h-[770px] pt-14 px-6">
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-tight">Ashoka Distribution</div>
          <div className="text-sm text-slate-500 mt-1 mb-8">Collections &amp; stock</div>
        </div>
        <div className="max-w-xs mx-auto">
          <div className="text-xs font-semibold text-slate-600 mb-1.5">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 mb-3 text-base outline-none focus:border-emerald-500" />
          <div className="text-xs font-semibold text-slate-600 mb-1.5">PIN</div>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 mb-3 text-base outline-none focus:border-emerald-500" />
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{err}</div>}
          <button onClick={submit} disabled={busy}
            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />} Log in
          </button>
          <div className="text-[11px] text-slate-400 text-center pt-3">
            Mock users: Money / 1234 (admin) · Rakesh / 1111 (manager) · Gurpreet Singh / 1111 (collector)
          </div>
        </div>
      </div>
    </div>
  )
}

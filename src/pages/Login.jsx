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
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-700/25 blur-3xl" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-glow mb-3">₹</div>
          <div className="font-display text-2xl font-bold tracking-tight text-white">Ashoka Distribution</div>
          <div className="text-sm text-slate-400 mt-1">Collections &amp; stock, in the field</div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 py-8 px-7">
          <div className="max-w-xs mx-auto">
            <div className="text-xs font-semibold text-slate-600 mb-1.5">Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 mb-3 text-base outline-none transition-colors focus:border-brand-500" />
            <div className="text-xs font-semibold text-slate-600 mb-1.5">PIN</div>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 mb-3 text-base outline-none transition-colors focus:border-brand-500" />
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 animate-fade-in">{err}</div>}
            <button onClick={submit} disabled={busy}
              className="w-full bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 transition-all">
              {busy && <Loader2 size={16} className="animate-spin" />} Log in
            </button>
            <div className="text-[11px] text-slate-400 text-center pt-4 leading-relaxed">
              Mock users: Money / 1234 (admin) · Rakesh / 1111 (manager) · Gurpreet Singh / 1111 (collector)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

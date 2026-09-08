import { useEffect, useState } from 'react'
import { Loader2, Plus, Building2 } from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { toast } from '../lib/toast.js'

export default function CompanyPicker() {
  const { auth, selectCompany, logout } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [list, setList] = useState(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.companies().then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return toast.error('Enter a company name')
    setBusy(true)
    try { await api.createCompany(name.trim()); setName(''); setAdding(false); await load(); toast.success('Company added') }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl" />

      <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 py-9 px-7 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-3 shadow-glow"><Building2 size={22} className="text-white" /></div>
          <div className="font-display text-xl font-bold tracking-tight">Choose company</div>
          <div className="text-sm text-slate-500 mt-1">Which company's dealers do you want to work on?</div>
        </div>

        {!list ? <div className="flex justify-center py-8 text-brand-600"><Loader2 className="animate-spin" /></div> : (
          <>
            {list.length === 0 && !adding && (
              <div className="text-center text-sm text-slate-500 mb-4">
                {isAdmin ? 'No companies yet. Create your first one — your existing data will be assigned to it.' : 'No company assigned to you yet. Ask your admin.'}
              </div>
            )}

            <div className="space-y-2.5 stagger">
              {list.map((c) => (
                <button key={c.id} onClick={() => selectCompany(c)}
                  className="group w-full flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-3.5 text-left hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-soft transition-all">
                  <span className="w-9 h-9 rounded-xl bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                    <Building2 size={17} className="text-brand-700" />
                  </span>
                  <span className="text-[15px] font-semibold text-slate-800">{c.name}</span>
                </button>
              ))}
            </div>

            {isAdmin && (
              adding ? (
                <div className="mt-4">
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name"
                    onKeyDown={(e) => e.key === 'Enter' && create()}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base mb-2 outline-none transition-colors focus:border-brand-500" />
                  <div className="flex gap-2">
                    <button onClick={() => { setAdding(false); setName('') }} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-[13px] hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={create} disabled={busy} className="flex-1 bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-1 shadow-glow disabled:opacity-60 transition-all">
                      {busy && <Loader2 size={14} className="animate-spin" />}Add
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdding(true)} className="w-full mt-3 flex items-center justify-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800 py-2 transition-colors">
                  <Plus size={15} />Add company
                </button>
              )
            )}
          </>
        )}

        <button onClick={logout} className="w-full mt-6 text-[12px] text-slate-400 hover:text-slate-600 transition-colors">Log out</button>
      </div>
    </div>
  )
}

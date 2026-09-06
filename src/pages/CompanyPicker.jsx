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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-10 px-7">
        <div className="text-center mb-6">
          <div className="text-xl font-extrabold tracking-tight">Choose company</div>
          <div className="text-sm text-slate-500 mt-1">Which company's dealers do you want to work on?</div>
        </div>

        {!list ? <div className="flex justify-center py-8 text-slate-400"><Loader2 className="animate-spin" /></div> : (
          <>
            {list.length === 0 && !adding && (
              <div className="text-center text-sm text-slate-500 mb-4">
                {isAdmin ? 'No companies yet. Create your first one — your existing data will be assigned to it.' : 'No company assigned to you yet. Ask your admin.'}
              </div>
            )}

            <div className="space-y-2.5">
              {list.map((c) => (
                <button key={c.id} onClick={() => selectCompany(c)}
                  className="w-full flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3.5 text-left hover:border-emerald-500 hover:bg-emerald-50/40">
                  <Building2 size={18} className="text-emerald-700 shrink-0" />
                  <span className="text-[15px] font-semibold text-slate-800">{c.name}</span>
                </button>
              ))}
            </div>

            {isAdmin && (
              adding ? (
                <div className="mt-4">
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name"
                    onKeyDown={(e) => e.key === 'Enter' && create()}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-base mb-2 outline-none focus:border-emerald-500" />
                  <div className="flex gap-2">
                    <button onClick={() => { setAdding(false); setName('') }} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-[13px]">Cancel</button>
                    <button onClick={create} disabled={busy} className="flex-1 bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-1 disabled:opacity-60">
                      {busy && <Loader2 size={14} className="animate-spin" />}Add
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdding(true)} className="w-full mt-3 flex items-center justify-center gap-1 text-[13px] font-semibold text-emerald-700 py-2">
                  <Plus size={15} />Add company
                </button>
              )
            )}
          </>
        )}

        <button onClick={logout} className="w-full mt-6 text-[12px] text-slate-400">Log out</button>
      </div>
    </div>
  )
}

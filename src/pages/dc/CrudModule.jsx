import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-brand-500'

/**
 * Config-driven CRUD list module for the Daily Collections hub.
 * props: name, title, hint, fields[], primary(row), secondary(row),
 *        toggles[] ({k,onLabel,offLabel,onTone}), search(bool),
 *        amountKey(str for total), running(bool -> balance = credit-debit)
 */
export default function CrudModule({ name, title, hint, fields = [], primary, secondary, toggles = [], search = false, amountKey, running = false }) {
  const [rows, setRows] = useState(null)
  const [f, setF] = useState({})
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => api.dcList(name).then((r) => setRows(r.rows || []))
  useEffect(() => { setRows(null); setF({}); setQ(''); load() }, [name]) // eslint-disable-line

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    for (const fl of fields) if (fl.required && !String(f[fl.k] ?? '').trim()) return toast.error('Enter ' + fl.label)
    setBusy(true)
    try {
      const body = {}
      fields.forEach((fl) => { body[fl.k] = fl.type === 'number' ? (+f[fl.k] || 0) : (f[fl.k] ?? '') })
      toggles.forEach((t) => { body[t.k] = false })
      await api.dcAdd(name, body); toast.success('Added'); setF({}); load()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  const del = async (id) => { await api.dcRemove(name, id); load() }
  const flip = async (id, k, v) => { await api.dcPatch(name, id, { [k]: !v }); load() }

  const shown = useMemo(() => {
    if (!rows) return []
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(n))
  }, [rows, q])

  const total = amountKey && rows ? rows.reduce((s, r) => s + (+r[amountKey] || 0), 0) : null
  let bal = 0

  if (!rows) return <Spin />
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
        {total != null && <div className="text-[13px] font-bold text-slate-900">{inr(total)}</div>}
      </div>
      {hint && <div className="text-[12px] text-slate-500 mb-3">{hint}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {fields.map((fl) => (
            <div key={fl.k} className={fl.full ? 'col-span-2' : ''}>
              {fl.type === 'select' ? (
                <select data-testid={'dc-' + name + '-' + fl.k} className={inp} value={f[fl.k] ?? ''} onChange={(e) => set(fl.k, e.target.value)}>
                  <option value="">{fl.label}…</option>
                  {fl.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input data-testid={'dc-' + name + '-' + fl.k} className={inp} type={fl.type === 'number' ? 'number' : fl.type === 'date' ? 'date' : 'text'}
                  placeholder={fl.label} value={f[fl.k] ?? ''} onChange={(e) => set(fl.k, e.target.value)} />
              )}
            </div>
          ))}
        </div>
        <button data-testid={'dc-' + name + '-add'} onClick={save} disabled={busy} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60 transition-colors"><Plus size={16} />Add</button>
      </div>

      {search && <input className={inp + ' mb-3'} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />}

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50">
        {shown.length === 0 ? <div className="p-4 text-[13px] text-slate-400">Nothing yet.</div> : shown.map((r) => {
          if (running) bal += (+r.credit || 0) - (+r.debit || 0)
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-2.5" data-testid={'dc-' + name + '-row'}>
              <div className="min-w-0 pr-2">
                <div className="text-[13px] font-semibold text-slate-800 truncate">{primary(r)}</div>
                <div className="text-[11px] text-slate-400 truncate">{secondary ? secondary(r) : ''}{running ? ' · bal ' + inr(bal) : ''}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {toggles.map((t) => (
                  <button key={t.k} onClick={() => flip(r.id, t.k, r[t.k])}
                    className={'text-[11px] font-bold px-2 py-1 rounded-full ring-1 ' + (r[t.k] ? (t.onTone || 'text-emerald-700 bg-emerald-50 ring-emerald-100') : 'text-slate-500 bg-slate-100 ring-slate-200')}>
                    {r[t.k] ? t.onLabel : t.offLabel}
                  </button>
                ))}
                <button onClick={() => del(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

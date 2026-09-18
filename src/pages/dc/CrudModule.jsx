import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin, Modal, BackBtn } from '../../components/ui.jsx'
import { confirmDialog } from '../../lib/confirm.js'
import { Hero, ListCard, Row, Chip, Fab, Field, inp, PrimaryBtn } from './bits.jsx'
import { CRUD } from './modules.js'

export default function CrudModule() {
  const { name } = useParams()
  const nav = useNavigate()
  const cfg = CRUD[name]
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const load = () => api.dcList(name).then((r) => setRows(r.rows || []))
  useEffect(() => { if (!cfg) return nav('/more'); setRows(null); setQ(''); load() }, [name]) // eslint-disable-line
  const del = async (id) => { if (await confirmDialog('Delete this entry?', { danger: true })) { await api.dcRemove(name, id); load() } }
  const flip = async (id, k, v) => { await api.dcPatch(name, id, { [k]: !v }); load() }
  const shown = useMemo(() => {
    if (!rows) return []
    const n = q.trim().toLowerCase()
    return n ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(n)) : rows
  }, [rows, q])
  if (!cfg) return null
  if (!rows) return <Spin />
  const total = cfg.amountKey ? rows.reduce((s, r) => s + (+r[cfg.amountKey] || 0), 0) : null
  const openCount = cfg.toggles?.length ? rows.filter((r) => !r[cfg.toggles[0].k]).length : null
  const Icon = cfg.icon
  let bal = 0
  return (
    <>
      <BackBtn label="All tools" />
      <div className="flex items-center gap-3 mb-4">
        <div className={'h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-soft ' + cfg.tone}><Icon size={20} /></div>
        <div><h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{cfg.title}</h1><div className="text-[12.5px] text-slate-500">{cfg.hint}</div></div>
      </div>
      <Hero eyebrow={total != null ? 'Total' : 'Entries'} value={total != null ? inr(total) : rows.length}
        sub={rows.length + ' entries' + (openCount != null ? ' · ' + openCount + ' ' + cfg.toggles[0].offLabel.toLowerCase() : '')} testid={'dc-' + name + '-hero'} />
      {(cfg.search || rows.length > 8) && <input data-testid={'dc-' + name + '-search'} className={inp + ' mt-4 shadow-soft'} placeholder={'Search ' + cfg.title.toLowerCase() + '…'} value={q} onChange={(e) => setQ(e.target.value)} />}
      <div className="mt-4">
        <ListCard empty={'No entries yet. Tap Add to create the first ' + cfg.title.toLowerCase() + ' entry.'} testid={'dc-' + name + '-list'}>
          {shown.map((r) => {
            if (cfg.running) bal += (+r.credit || 0) - (+r.debit || 0)
            const done = cfg.toggles?.length ? !!r[cfg.toggles[0].k] : false
            return (
              <Row key={r.id} testid={'dc-' + name + '-row'} title={cfg.primary(r)} sub={cfg.secondary?.(r)} tone={done ? 'bg-slate-200' : cfg.tone} onDelete={() => del(r.id)}
                right={<div className="flex items-center gap-2">
                  {cfg.amount && <div className={'text-[14px] font-bold ' + (done ? 'text-slate-400 line-through' : 'text-slate-900')}>{cfg.amount(r)}</div>}
                  {cfg.running && <div className="text-[12px] font-bold text-indigo-700">{inr(bal)}</div>}
                  {(cfg.toggles || []).map((t) => (
                    <Chip key={t.k} testid={'dc-' + name + '-toggle'} onClick={() => flip(r.id, t.k, r[t.k])} tone={r[t.k] ? (t.onTone || 'text-emerald-700 bg-emerald-50 ring-emerald-100') : 'text-slate-600 bg-white ring-slate-300'}>{r[t.k] ? t.onLabel : t.offLabel}</Chip>
                  ))}
                </div>}>
                {cfg.badge && cfg.badge(r) && <div className="mt-1.5"><Chip>{cfg.badge(r)}</Chip></div>}
              </Row>
            )
          })}
        </ListCard>
      </div>
      <Fab label="Add" testid={'dc-' + name + '-fab'} onClick={() => setAdding(true)} />
      {adding && <AddSheet name={name} cfg={cfg} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
    </>
  )
}

function AddSheet({ name, cfg, onClose, onSaved }) {
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    for (const fl of cfg.fields) if (fl.required && !String(f[fl.k] ?? '').trim()) return toast.error('Enter ' + fl.label)
    setBusy(true)
    try {
      const body = {}
      cfg.fields.forEach((fl) => { body[fl.k] = fl.type === 'number' ? (+f[fl.k] || 0) : (f[fl.k] ?? '') })
      ;(cfg.toggles || []).forEach((t) => { body[t.k] = false })
      await api.dcAdd(name, body); toast.success('Added'); onSaved()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={'Add · ' + cfg.title} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {cfg.fields.map((fl) => (
          <div key={fl.k} className={fl.full ? 'col-span-2' : ''}>
            <Field label={fl.label + (fl.required ? ' *' : '')}>
              {fl.type === 'select' ? (
                <select data-testid={'dc-' + name + '-' + fl.k} className={inp} value={f[fl.k] ?? ''} onChange={(e) => set(fl.k, e.target.value)}>
                  <option value="">Select…</option>{fl.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input data-testid={'dc-' + name + '-' + fl.k} className={inp} type={fl.type || 'text'} inputMode={fl.type === 'number' ? 'decimal' : undefined}
                  placeholder={fl.type === 'number' ? '0' : ''} value={f[fl.k] ?? ''} onChange={(e) => set(fl.k, e.target.value)} />
              )}
            </Field>
          </div>
        ))}
      </div>
      <div className="mt-5"><PrimaryBtn testid={'dc-' + name + '-add'} onClick={save} disabled={busy}>Save</PrimaryBtn></div>
    </Modal>
  )
}

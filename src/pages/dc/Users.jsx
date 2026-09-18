import { useEffect, useState } from 'react'
import { Shield, Pencil, KeyRound } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin, Modal } from '../../components/ui.jsx'
import { PageHead, ListCard, Row, Chip, Fab, Field, inp, PrimaryBtn } from './bits.jsx'

const ROLES = [['collector', 'Staff'], ['manager', 'Manager'], ['admin', 'Admin']]
const roleLabel = (r) => (ROLES.find(([k]) => k === r) || [, r])[1]
const roleTone = (r) => r === 'admin' ? 'text-brand-700 bg-brand-50 ring-brand-100' : r === 'manager' ? 'text-sky-700 bg-sky-50 ring-sky-100' : 'text-emerald-700 bg-emerald-50 ring-emerald-100'

export default function Users() {
  const { auth } = useAuth()
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const reload = () => api.users().then(setData)
  useEffect(() => { reload() }, [])
  if (auth.user.role !== 'admin') return <PageHead title="Staff" sub="Admins only." />
  if (!data) return <Spin />

  const del = async (u) => {
    if (u.id === auth.user.id) return toast.error('You cannot delete your own account')
    if (await confirmDialog('Remove ' + u.name + '?', { danger: true, confirmLabel: 'Remove' })) {
      await api.delUser(u.id); reload(); toast.success('Staff removed')
    }
  }

  return (
    <>
      <PageHead title="Staff" sub="Who can log in & use this shop" />
      <ListCard empty="No staff yet. Tap Add staff to create a login." testid="dc-users-list">
        {data.map((u) => (
          <Row key={u.id} testid={'dc-user-' + u.id} title={u.name} tone={u.role === 'admin' ? 'bg-brand-500' : u.role === 'manager' ? 'bg-sky-500' : 'bg-emerald-500'}
            onClick={() => setEditing(u)} onDelete={u.id === auth.user.id ? undefined : () => del(u)}
            right={<Pencil size={13} className="text-brand-600" />}>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Chip tone={roleTone(u.role)}>{roleLabel(u.role)}</Chip>
              {u.id === auth.user.id && <Chip tone="text-slate-600 bg-slate-100 ring-slate-200">You</Chip>}
            </div>
          </Row>
        ))}
      </ListCard>
      <Fab label="Add staff" testid="dc-fab-user" onClick={() => setEditing({ role: 'collector' })} />
      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const { company } = useAuth()
  const [f, setF] = useState({ name: user.name || '', pin: '', role: user.role || 'collector', company_ids: user.company_ids || (user.id ? [] : (company ? [company.id] : [])) })
  const [companies, setCompanies] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.companies().then(setCompanies) }, [])
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.name.trim()) return toast.error('Name is required')
    if (!user.id && f.pin.length !== 4) return toast.error('Set a 4-digit PIN')
    if (user.id && f.pin && f.pin.length !== 4) return toast.error('PIN must be 4 digits')
    setBusy(true)
    try {
      await api.saveUser({ id: user.id, name: f.name.trim(), role: f.role, company_ids: f.company_ids, ...(f.pin ? { pin: f.pin } : {}) })
      toast.success('Saved'); onSaved()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={user.id ? 'Edit staff' : 'Add staff'} onClose={onClose}>
      <Field label="Name"><input data-testid="dc-user-name" autoFocus className={inp} placeholder="e.g. Rahul" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label={user.id ? 'New PIN' : '4-digit PIN'} hint={user.id ? 'blank = keep' : ''}>
          <div className="relative">
            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="dc-user-pin" className={inp + ' pl-9'} type="number" inputMode="numeric" placeholder="••••" value={f.pin} onChange={(e) => set('pin', e.target.value.slice(0, 4))} />
          </div>
        </Field>
        <Field label="Role">
          <div className="flex gap-1.5 mt-0.5">
            {ROLES.map(([k, l]) => (
              <button key={k} type="button" data-testid={'dc-role-' + k} onClick={() => set('role', k)}
                className={'flex-1 text-[12.5px] font-semibold rounded-xl px-2 py-2.5 border transition-colors ' + (f.role === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2"><Shield size={13} />Companies this staff can open</div>
        {companies.length === 0 ? <div className="text-[12px] text-slate-400 py-1">No companies found.</div> : (
          <div className="space-y-1.5">
            {companies.map((c) => {
              const on = f.company_ids.includes(c.id)
              return (
                <button type="button" key={c.id} data-testid={'dc-user-co-' + c.id} onClick={() => set('company_ids', on ? f.company_ids.filter((x) => x !== c.id) : [...f.company_ids, c.id])}
                  className={'w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ' + (on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600')}>
                  {c.name}<span>{on ? '\u2713' : ''}</span>
                </button>
              )
            })}
          </div>
        )}
        {f.role !== 'admin' && <div className="text-[11px] text-slate-400 mt-2 px-0.5">Admins can always open every company.</div>}
      </div>

      <div className="mt-5"><PrimaryBtn testid="dc-save-user" onClick={save} disabled={busy}>{user.id ? 'Save changes' : 'Create staff'}</PrimaryBtn></div>
    </Modal>
  )
}

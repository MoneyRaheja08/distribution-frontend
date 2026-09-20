import { useEffect, useState } from 'react'
import { Pencil, KeyRound } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin, Modal } from '../../components/ui.jsx'
import { PageHead, ListCard, Row, Chip, Fab, Field, inp, PrimaryBtn } from './bits.jsx'

const ROLES = [['collector', 'Staff'], ['manager', 'Manager'], ['admin', 'Admin']]
const roleLabel = (r) => (ROLES.find(([k]) => k === r) || [, r])[1]
const roleTone = (r) => r === 'admin' ? 'text-brand-700 bg-brand-50 ring-brand-100' : r === 'manager' ? 'text-sky-700 bg-sky-50 ring-sky-100' : 'text-emerald-700 bg-emerald-50 ring-emerald-100'

export const DC_FEATURES = [
  { title: 'Daily Collections', items: [['collections', 'Bills / Collections'], ['pending', 'Outstanding / Pending'], ['expenses', 'Expenses'], ['cash', 'My Cash'], ['exchange', 'Exchange items'], ['dayclose', 'Day close'], ['reports', 'Reports']] },
  { title: 'Registers', items: [['reminders', 'Reminders'], ['pricelist', 'Price List'], ['todo', 'To-Do'], ['defective', 'Defective Stock'], ['audits', 'Stock Audit'], ['schemes', 'Schemes'], ['ledger', 'Payment Audit'], ['attendance', 'Attendance'], ['crm', 'CRM']] },
]
const ALL_KEYS = DC_FEATURES.flatMap((g) => g.items.map(([k]) => k))

export default function Users() {
  const { auth } = useAuth()
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const reload = () => api.dcUsers().then(setData)
  useEffect(() => { reload() }, [])
  if (auth.user.role !== 'admin') return <PageHead title="Staff" sub="Admins only." />
  if (!data) return <Spin />

  const del = async (u) => {
    if (u.id === auth.user.id) return toast.error('You cannot remove your own account')
    if (await confirmDialog('Remove ' + u.name + ' from this shop?', { danger: true, confirmLabel: 'Remove' })) {
      await api.dcDeleteUser(u.id); reload(); toast.success('Staff removed')
    }
  }
  const permCount = (u) => u.role === 'admin' ? 'all access' : ALL_KEYS.filter((k) => (u.perms || {})[k] !== false).length + '/' + ALL_KEYS.length + ' features'

  return (
    <>
      <PageHead title="Staff" sub="Logins, PINs & what each person can open" />
      <ListCard empty="No staff yet. Tap Add staff to create a login." testid="dc-users-list">
        {data.map((u) => (
          <Row key={u.id} testid={'dc-user-' + u.id} title={u.name} tone={u.role === 'admin' ? 'bg-brand-500' : u.role === 'manager' ? 'bg-sky-500' : 'bg-emerald-500'}
            onClick={() => setEditing(u)} onDelete={u.id === auth.user.id ? undefined : () => del(u)} right={<Pencil size={13} className="text-brand-600" />}>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Chip tone={roleTone(u.role)}>{roleLabel(u.role)}</Chip>
              <Chip tone="text-slate-600 bg-slate-100 ring-slate-200">{permCount(u)}</Chip>
              {u.id === auth.user.id && <Chip tone="text-slate-600 bg-slate-100 ring-slate-200">You</Chip>}
            </div>
          </Row>
        ))}
      </ListCard>
      <Fab label="Add staff" testid="dc-fab-user" onClick={() => setEditing({ role: 'collector', perms: {} })} />
      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const [f, setF] = useState({ name: user.name || '', pin: '', role: user.role || 'collector' })
  const [perms, setPerms] = useState(() => Object.fromEntries(ALL_KEYS.map((k) => [k, (user.perms || {})[k] !== false])))
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const tog = (k) => setPerms((p) => ({ ...p, [k]: !p[k] }))
  const bulk = (v) => setPerms(Object.fromEntries(ALL_KEYS.map((k) => [k, v])))

  const save = async () => {
    if (!f.name.trim()) return toast.error('Name is required')
    if (!user.id && f.pin.length !== 4) return toast.error('Set a 4-digit PIN')
    if (user.id && f.pin && f.pin.length !== 4) return toast.error('PIN must be 4 digits')
    setBusy(true)
    try {
      const body = { name: f.name.trim(), role: f.role, perms, ...(f.pin ? { pin: f.pin } : {}) }
      if (user.id) await api.dcUpdateUser(user.id, body)
      else await api.dcCreateUser(body)
      toast.success('Saved'); onSaved()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const isAdmin = f.role === 'admin'
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

      {isAdmin ? (
        <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-100 p-3.5 text-[12.5px] text-brand-800 font-semibold">Admins can open everything — no feature limits.</div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">What this staff can open</div>
            <div className="flex gap-1.5">
              <button type="button" data-testid="dc-perm-all" onClick={() => bulk(true)} className="text-[11px] font-bold text-brand-700">All</button>
              <button type="button" data-testid="dc-perm-none" onClick={() => bulk(false)} className="text-[11px] font-bold text-slate-400">None</button>
            </div>
          </div>
          {DC_FEATURES.map((g) => (
            <div key={g.title} className="mb-2 last:mb-0">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 px-0.5">{g.title}</div>
              <div className="space-y-1.5">
                {g.items.map(([k, l]) => (
                  <button type="button" key={k} data-testid={'dc-perm-' + k} onClick={() => tog(k)}
                    className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5 bg-white">
                    <span className="text-[13px] font-semibold text-slate-700">{l}</span>
                    <span className={'w-11 h-6 rounded-full relative transition-colors ' + (perms[k] ? 'bg-emerald-600' : 'bg-slate-300')}><span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ' + (perms[k] ? 'left-[22px]' : 'left-0.5')} /></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5"><PrimaryBtn testid="dc-save-user" onClick={save} disabled={busy}>{user.id ? 'Save changes' : 'Create staff'}</PrimaryBtn></div>
    </Modal>
  )
}

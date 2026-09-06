import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { exportWorkbook } from '../../lib/excel.js'
import { Spin, SectionH, RowActions, BackBtn, Modal, Field, Select } from '../../components/ui.jsx'

export default function Users() {
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const reload = () => api.users().then(setData)
  useEffect(() => { reload() }, [])
  if (!data) return <Spin />

  const del = async (id) => { if (await confirmDialog('Delete this user?', { danger: true, confirmLabel: 'Delete' })) { await api.delUser(id); reload(); toast.success('User deleted') } }
  const doBackup = async () => {
    const b = await api.backup()
    exportWorkbook('ashoka-backup-' + new Date().toISOString().slice(0, 10) + '.xlsx', [
      { name: 'Dealers', aoa: [['Dealer', 'Area', 'Phone', 'Credit limit', 'Collector'], ...b.dealers.map((d) => [d.name, d.area, d.phone, d.credit_limit, d.collector])], money: [3] },
      { name: 'Bills', aoa: [['Dealer', 'Bill No', 'Date', 'Amount'], ...b.bills.map((x) => [x.dealer, x.bill_no, x.date, x.amount])], money: [3] },
      { name: 'Payments', aoa: [['Dealer', 'Amount', 'Mode', 'Cheque', 'Date', 'Status', 'Collector', 'Approved', 'Reconciled'], ...b.payments.map((p) => [p.dealer, p.amount, p.mode, p.cheque, p.date, p.status, p.collector, p.approved ? 'Yes' : 'No', p.reconciled ? 'Yes' : 'No'])], money: [1] },
    ])
  }

  return (
    <>
      <BackBtn label="Overview" />
      <SectionH onAdd={() => setEditing({ role: 'collector' })}>Users</SectionH>
      <button onClick={doBackup} className="w-full mb-3 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-[13px]">Download full backup (Excel)</button>
      <div className="space-y-2">
        {data.map((u) => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <div className="text-[14px] font-semibold">{u.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 capitalize">{u.role}</div>
              <RowActions onEdit={() => setEditing(u)} onDel={() => del(u.id)} />
            </div>
          </div>
        ))}
      </div>
      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const [f, setF] = useState({ name: user.name || '', pin: '', role: user.role || 'collector', can_collect: !!user.can_collect, company_ids: user.company_ids || [] })
  const [companies, setCompanies] = useState([])
  useEffect(() => { api.companies().then(setCompanies) }, [])
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.name.trim()) return toast.error('Name is required')
    if (!user.id && f.pin.length !== 4) return toast.error('Set a 4-digit PIN')
    await api.saveUser({ id: user.id, name: f.name.trim(), role: f.role, can_collect: f.can_collect, company_ids: f.company_ids, ...(f.pin ? { pin: f.pin } : {}) })
    toast.success('Saved'); onSaved()
  }
  return (
    <Modal title={user.id ? 'Edit user' : 'Add user'} onClose={onClose}>
      <Field label="Name" value={f.name} onChange={(v) => set('name', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={user.id ? 'New PIN (blank = keep)' : '4-digit PIN'} value={f.pin} onChange={(v) => set('pin', v)} type="number" />
        <Select label="Role" value={f.role} onChange={(v) => set('role', v)}
          options={[['collector', 'Collector'], ['manager', 'Manager'], ['admin', 'Admin']]} />
      </div>
      {f.role === 'manager' && (
        <button type="button" onClick={() => set('can_collect', !f.can_collect)}
          className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-3 bg-white mb-1">
          <div className="text-left">
            <div className="text-[13px] font-semibold text-slate-700">Can record collections</div>
            <div className="text-[11px] text-slate-500">Let this manager post payments (e.g. dealer RTGS)</div>
          </div>
          <div className={'w-11 h-6 rounded-full relative transition-colors ' + (f.can_collect ? 'bg-emerald-600' : 'bg-slate-300')}>
            <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ' + (f.can_collect ? 'left-[22px]' : 'left-0.5')} />
          </div>
        </button>
      )}
      {f.role !== 'admin' && companies.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-slate-600 mb-1.5">Companies this user can access</div>
          <div className="space-y-1.5">
            {companies.map((c) => {
              const on = f.company_ids.includes(c.id)
              return (
                <button type="button" key={c.id} onClick={() => set('company_ids', on ? f.company_ids.filter((x) => x !== c.id) : [...f.company_ids, c.id])}
                  className={'w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-[13px] font-semibold ' + (on ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600')}>
                  {c.name}<span>{on ? '\u2713' : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-2">Save</button>
    </Modal>
  )
}

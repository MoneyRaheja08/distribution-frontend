import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr, AGE_LABELS } from '../../lib/format.js'
import { Spin, SectionH, RowActions, Pill, Modal, Field, Select } from '../../components/ui.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function Dealers() {
  const { auth } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [data, setData] = useState(null)
  const [collectors, setCollectors] = useState([])
  const [editing, setEditing] = useState(null) // dealer object or {} for new

  const reload = () => api.dealers().then(setData)
  useEffect(() => {
    reload()
    api.users().then((us) => setCollectors(us.filter((u) => u.role === 'collector')))
  }, [])
  if (!data) return <Spin />

  const del = async (id) => { if (confirm('Delete this dealer?')) { await api.delDealer(id); reload() } }

  return (
    <>
      <SectionH onAdd={() => setEditing({ ageing: {} })}>Dealers</SectionH>
      <div className="space-y-2">
        {data.length === 0 && <div className="text-center text-slate-400 text-sm py-10 bg-white border border-dashed border-slate-200 rounded-xl">No dealers yet. Tap Add.</div>}
        {data.map((d) => {
          const over = d.outstanding > d.credit_limit
          return (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <div className="text-[15px] font-semibold">{d.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{d.area || '—'}</div>
                {over && <Pill tone="over">Over limit</Pill>}
                {d.ageing.age_90p > 0 && <Pill tone="old">90+ dues</Pill>}
                <RowActions onEdit={() => setEditing(d)} onDel={isAdmin ? () => del(d.id) : null} />
              </div>
              <div className="text-[15px] font-bold">{inr(d.outstanding)}</div>
            </div>
          )
        })}
      </div>
      {editing && (
        <DealerForm dealer={editing} collectors={collectors}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }} />
      )}
    </>
  )
}

function DealerForm({ dealer, collectors, onClose, onSaved }) {
  const a = dealer.ageing || {}
  const [f, setF] = useState({
    name: dealer.name || '', area: dealer.area || '', phone: dealer.phone || '',
    credit_limit: dealer.credit_limit || '', collector_id: dealer.collector_id || '',
    age_0_30: a.age_0_30 || '', age_31_60: a.age_31_60 || '', age_61_90: a.age_61_90 || '', age_90p: a.age_90p || '',
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.name.trim()) return alert('Name is required')
    await api.saveDealer({
      id: dealer.id, name: f.name.trim(), area: f.area, phone: f.phone,
      credit_limit: +f.credit_limit || 0, collector_id: f.collector_id || null,
      ageing: { age_0_30: +f.age_0_30 || 0, age_31_60: +f.age_31_60 || 0, age_61_90: +f.age_61_90 || 0, age_90p: +f.age_90p || 0 },
    })
    onSaved()
  }

  return (
    <Modal title={dealer.id ? 'Edit dealer' : 'Add dealer'} onClose={onClose}>
      <Field label="Shop / dealer name" value={f.name} onChange={(v) => set('name', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area" value={f.area} onChange={(v) => set('area', v)} />
        <Field label="Phone" value={f.phone} onChange={(v) => set('phone', v)} />
      </div>
      <Field label="Credit limit ₹" value={f.credit_limit} onChange={(v) => set('credit_limit', v)} type="number" />
      <Select label="Assign collector" value={f.collector_id} onChange={(v) => set('collector_id', v)}
        options={[['', '— unassigned —'], ...collectors.map((c) => [c.id, c.name])]} />
      <div className="text-xs font-semibold text-slate-600 mb-1.5">Outstanding by age (₹)</div>
      <div className="grid grid-cols-2 gap-3">
        {AGE_LABELS.map(([k, l]) => <Field key={k} label={l + ' days'} value={f[k]} onChange={(v) => set(k, v)} type="number" />)}
      </div>
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-2">Save</button>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin, SectionH, RowActions, Modal, Field } from '../../components/ui.jsx'

export default function Stock() {
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const reload = () => api.stock().then(setData)
  useEffect(() => { reload() }, [])
  if (!data) return <Spin />

  const del = async (id) => { if (confirm('Delete this product?')) { await api.delStock(id); reload() } }

  return (
    <>
      <SectionH onAdd={() => setEditing({})}>Godown stock</SectionH>
      {data.length === 0 && <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">No stock yet. Tap “Add” to add a product.</div>}
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {data.map((s) => {
          const c = s.qty === 0 ? 'text-red-700' : s.qty <= 8 ? 'text-amber-700' : ''
          const tag = s.qty === 0 ? 'Out' : s.qty <= 8 ? 'Low' : 'In stock'
          return (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <div className="text-[14px] font-semibold">{s.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Dealer price {inr(s.price)}</div>
                <RowActions onEdit={() => setEditing(s)} onDel={() => del(s.id)} />
              </div>
              <div className={'text-right ' + c}><div className="text-base font-extrabold">{s.qty}</div><div className="text-[10px] text-slate-500">{tag}</div></div>
            </div>
          )
        })}
      </div>
      {editing && <StockForm item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}

function StockForm({ item, onClose, onSaved }) {
  const [f, setF] = useState({ name: item.name || '', price: item.price || '', qty: item.qty ?? '' })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.name.trim()) return alert('Name is required')
    await api.saveStock({ id: item.id, name: f.name.trim(), price: +f.price || 0, qty: +f.qty || 0 })
    onSaved()
  }
  return (
    <Modal title={item.id ? 'Edit product' : 'Add product'} onClose={onClose}>
      <Field label="Model / name" value={f.name} onChange={(v) => set('name', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dealer price ₹" value={f.price} onChange={(v) => set('price', v)} type="number" />
        <Field label="Quantity" value={f.qty} onChange={(v) => set('qty', v)} type="number" />
      </div>
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-2">Save</button>
    </Modal>
  )
}

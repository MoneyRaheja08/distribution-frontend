import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Upload, Loader2, ChevronRight, Pencil, Trash2, Users as UsersIcon, Plus, X } from 'lucide-react'
import { api } from '../api/client.js'
import { inr } from '../lib/format.js'
import { parseFlexibleWorkbook } from '../lib/pricelist.js'
import { Spin, Modal, Field, Select } from '../components/ui.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { toast } from '../lib/toast.js'
import { confirmDialog } from '../lib/confirm.js'

const DEFAULT_COLS = ['Category', 'Model', 'MRP', 'DP', 'NLC']
const fmtCell = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN') : (v == null ? '' : String(v)))

export default function Prices() {
  const { auth } = useAuth()
  const staff = auth.user.role === 'admin' || auth.user.role === 'manager'
  const isAdmin = auth.user.role === 'admin'
  const [lists, setLists] = useState(null)
  const [open, setOpen] = useState(null)
  const [modal, setModal] = useState(null)

  const loadLists = () => api.pricelists().then(setLists)
  useEffect(() => { loadLists() }, [])

  if (open) return <Browse list={open} staff={staff} onBack={() => { setOpen(null); loadLists() }} />
  if (!lists) return <Spin />

  return (
    <>
      <div className="flex justify-between items-center mb-3 px-0.5">
        <div className="text-xs font-bold text-slate-600">Price lists</div>
        {staff && <button onClick={() => setModal({ kind: 'new' })} className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1"><Plus size={13} />New</button>}
      </div>
      {lists.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10 bg-white border border-dashed border-slate-200 rounded-xl">
          {staff ? 'No price lists yet. Tap “New”.' : 'No price lists shared with you yet.'}
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {lists.map((pl) => (
            <div key={pl.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <button onClick={() => setOpen(pl)} className="w-full flex justify-between items-center text-left">
                <div><div className="text-[15px] font-semibold">{pl.name}</div><div className="text-[11px] text-slate-500 mt-0.5">{pl.count} rows</div></div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              {staff && (
                <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 flex-wrap">
                  <Btn icon={UsersIcon} label="Access" onClick={() => setModal({ kind: 'access', list: pl })} />
                  <Btn icon={Upload} label="Import" onClick={() => setModal({ kind: 'import', list: pl })} />
                  <Btn icon={Pencil} label="Rename" onClick={() => setModal({ kind: 'rename', list: pl })} />
                  {isAdmin && <Btn icon={Trash2} label="Delete" red onClick={async () => { if (await confirmDialog('Delete “' + pl.name + '” and all its products?', { danger: true, confirmLabel: 'Delete' })) { await api.deletePricelist(pl.id); toast.success('Deleted'); loadLists() } }} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {modal?.kind === 'new' && <NewListModal onClose={() => setModal(null)} onDone={() => { setModal(null); loadLists() }} />}
      {modal?.kind === 'import' && <ImportModal list={modal.list} onClose={() => setModal(null)} onDone={() => { setModal(null); loadLists() }} />}
      {modal?.kind === 'access' && <AccessModal list={modal.list} onClose={() => setModal(null)} onDone={() => { setModal(null); loadLists() }} />}
      {modal?.kind === 'rename' && <RenameModal list={modal.list} onClose={() => setModal(null)} onDone={() => { setModal(null); loadLists() }} />}
    </>
  )
}

function Btn({ icon: Icon, label, onClick, red }) {
  return <button onClick={onClick} className={'text-[11px] font-semibold border rounded-lg px-2.5 py-1 flex items-center gap-1 ' + (red ? 'text-red-700 border-red-200' : 'text-slate-600 border-slate-200')}><Icon size={11} />{label}</button>
}

// ---- dynamic spreadsheet-style browse ----
function Browse({ list, staff, onBack }) {
  const [items, setItems] = useState(null)
  const [cols, setCols] = useState(list.columns || DEFAULT_COLS)
  const [modelCol, setModelCol] = useState(list.model_col || 'Model')
  const [priceCol, setPriceCol] = useState(list.price_col || 'DP')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [editRow, setEditRow] = useState(null)
  const [settings, setSettings] = useState(false)

  const load = () => api.pricelistProducts(list.id).then(setItems).catch(() => setItems([]))
  useEffect(() => { load() }, [list.id])

  const cats = useMemo(() => items ? ['All', ...Array.from(new Set(items.map((p) => p.cells?.Category).filter(Boolean)))] : ['All'], [items])
  const rows = useMemo(() => {
    if (!items) return []
    const n = q.trim().toLowerCase()
    return items.filter((p) => (cat === 'All' || p.cells?.Category === cat) &&
      (!n || Object.values(p.cells || {}).some((v) => String(v).toLowerCase().includes(n))))
  }, [items, q, cat])

  const delRow = async (p) => { if (await confirmDialog('Delete this row?', { danger: true, confirmLabel: 'Delete' })) { await api.deleteProduct(list.id, p.id); toast.success('Deleted'); load() } }
  const delCol = async (c) => {
    if (await confirmDialog('Delete column “' + c + '” from every row?', { danger: true, confirmLabel: 'Delete column' })) {
      await api.deleteColumn(list.id, c); setCols((cs) => cs.filter((x) => x !== c)); toast.success('Column removed'); load()
    }
  }
  const saveCols = async (mc, pc) => { setModelCol(mc); setPriceCol(pc); await api.updatePricelist(list.id, { model_col: mc, price_col: pc }); toast.success('Saved') }

  if (!items) return <Spin />
  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">‹ Price lists</button>
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-bold">{list.name}</div>
        {staff && <div className="flex gap-2">
          <button onClick={() => setSettings((v) => !v)} className="text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5">Columns</button>
          <button onClick={() => setEditRow({})} className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1"><Plus size={13} />Row</button>
        </div>}
      </div>

      {staff && settings && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Select label="Model column (for orders)" value={modelCol} onChange={(v) => saveCols(v, priceCol)} options={cols.map((c) => [c, c])} />
            <Select label="Price column (for orders)" value={priceCol} onChange={(v) => saveCols(modelCol, v)} options={cols.map((c) => [c, c])} />
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Delete a column</div>
          <div className="flex flex-wrap gap-2">
            {cols.map((c) => (
              <button key={c} onClick={() => delCol(c)} className="text-[11px] font-semibold border border-red-200 text-red-700 rounded-lg px-2.5 py-1 flex items-center gap-1"><X size={11} />{c}</button>
            ))}
          </div>
        </div>
      )}

      {cats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
          {cats.map((cName) => (
            <button key={cName} onClick={() => setCat(cName)}
              className={'whitespace-nowrap text-[12px] font-semibold px-3 py-1.5 rounded-full border ' +
                (cat === cName ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>
              {cName === 'All' ? 'All sheets' : cName}
            </button>
          ))}
        </div>
      )}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-white text-base outline-none focus:border-emerald-500" />
      </div>
      <div className="text-[11px] text-slate-400 mb-2 px-0.5">{rows.length} rows</div>

      {rows.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10 bg-white border border-dashed border-slate-200 rounded-xl">No rows.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="text-[13px] min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {cols.map((c) => <th key={c} className="text-left font-bold text-slate-500 px-3 py-2 whitespace-nowrap">{c}</th>)}
                {staff && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  {cols.map((c) => <td key={c} className="px-3 py-2.5 whitespace-nowrap text-slate-800">{fmtCell(p.cells?.[c])}</td>)}
                  {staff && <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <button onClick={() => setEditRow(p)} className="text-slate-500 mr-3"><Pencil size={14} /></button>
                    <button onClick={() => delRow(p)} className="text-red-500"><Trash2 size={14} /></button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editRow && <RowForm list={list} cols={cols} row={editRow} onClose={() => setEditRow(null)} onDone={() => { setEditRow(null); load() }} />}
    </>
  )
}

function RowForm({ list, cols, row, onClose, onDone }) {
  const [f, setF] = useState(() => { const o = {}; cols.forEach((c) => { o[c] = row.cells?.[c] ?? '' }); return o })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    const cells = {}
    cols.forEach((c) => { const v = f[c]; if (v !== '' && v != null) cells[c] = isNaN(v) || v === '' ? v : (String(v).trim() && !isNaN(Number(v)) ? Number(v) : v) })
    try {
      if (row.id) await api.updateProduct(list.id, row.id, cells)
      else await api.addProduct(list.id, cells)
      toast.success('Saved'); onDone()
    } catch (e) { toast.error(e.message) }
  }
  return (
    <Modal title={row.id ? 'Edit row' : 'Add row'} onClose={onClose}>
      {cols.map((c) => <Field key={c} label={c} value={f[c]} onChange={(v) => set(c, v)} />)}
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-1">Save</button>
    </Modal>
  )
}

function importFlow(file, setBusy, setMsg, onImported) {
  setBusy(true); setMsg('')
  file.arrayBuffer().then(async (buf) => {
    try {
      const parsed = parseFlexibleWorkbook(buf)
      if (!parsed.rows.length) { setMsg('No rows found — check the file.'); setBusy(false); return }
      await onImported(parsed)
    } catch (e) { setMsg('Failed: ' + e.message); setBusy(false) }
  })
}

function NewListModal({ onClose, onDone }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  const pick = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!name.trim()) { setMsg('Enter a name first.'); e.target.value = ''; return }
    importFlow(file, setBusy, setMsg, async (parsed) => {
      const pl = await api.createPricelist({ name: name.trim(), allowed_user_ids: [] })
      await api.importFlexible(pl.id, parsed); toast.success('Imported ' + parsed.rows.length + ' rows'); onDone()
    })
  }
  return (
    <Modal title="New price list" onClose={onClose}>
      <Field label="Name" value={name} onChange={setName} />
      <div className="text-[12px] text-slate-500 mb-3">Upload any Excel — every column is kept. You can trim columns/rows after.</div>
      {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={pick} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{busy ? 'Importing…' : 'Choose Excel & create'}
      </button>
    </Modal>
  )
}

function ImportModal({ list, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  const pick = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    importFlow(file, setBusy, setMsg, async (parsed) => { await api.importFlexible(list.id, parsed); toast.success('Imported ' + parsed.rows.length + ' rows'); onDone() })
  }
  return (
    <Modal title={'Update “' + list.name + '”'} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">Uploading replaces this list's rows and columns (keeps every column from the file).</div>
      {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={pick} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{busy ? 'Importing…' : 'Choose Excel & replace'}
      </button>
    </Modal>
  )
}

function AccessModal({ list, onClose, onDone }) {
  const [users, setUsers] = useState(null)
  const [sel, setSel] = useState(new Set(list.allowed_user_ids || []))
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.selectableUsers().then(setUsers) }, [])
  const toggle = (id) => setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const save = async () => { setBusy(true); await api.updatePricelist(list.id, { allowed_user_ids: [...sel] }); toast.success('Saved'); onDone() }
  return (
    <Modal title={'Who can see “' + list.name + '”'} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">You (admin) always see every price list.</div>
      {!users ? <Spin /> : (
        <div className="space-y-2 mb-4">
          {users.length === 0 && <div className="text-[12px] text-slate-400">No collectors or managers yet.</div>}
          {users.map((u) => (
            <button key={u.id} onClick={() => toggle(u.id)} className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5 bg-white">
              <div className="text-left"><div className="text-[13px] font-semibold text-slate-700">{u.name}</div><div className="text-[11px] text-slate-500 capitalize">{u.role}</div></div>
              <div className={'w-11 h-6 rounded-full relative transition-colors ' + (sel.has(u.id) ? 'bg-emerald-600' : 'bg-slate-300')}>
                <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ' + (sel.has(u.id) ? 'left-[22px]' : 'left-0.5')} />
              </div>
            </button>
          ))}
        </div>
      )}
      <button onClick={save} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}Save access</button>
    </Modal>
  )
}

function RenameModal({ list, onClose, onDone }) {
  const [name, setName] = useState(list.name)
  const save = async () => { if (!name.trim()) return; await api.updatePricelist(list.id, { name: name.trim() }); toast.success('Renamed'); onDone() }
  return (
    <Modal title="Rename price list" onClose={onClose}>
      <Field label="Name" value={name} onChange={setName} />
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-1">Save</button>
    </Modal>
  )
}

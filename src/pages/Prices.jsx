import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Upload, Loader2, ChevronRight, Pencil, Trash2, Users as UsersIcon, Download, Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { inr } from '../lib/format.js'
import { parseHaierWorkbook, parseStandardTemplate, downloadTemplate } from '../lib/pricelist.js'
import { Spin, Modal, Field } from '../components/ui.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Prices() {
  const { auth } = useAuth()
  const staff = auth.user.role === 'admin' || auth.user.role === 'manager'
  const isAdmin = auth.user.role === 'admin'

  const [lists, setLists] = useState(null)
  const [open, setOpen] = useState(null)        // opened price list (browse view)
  const [modal, setModal] = useState(null)      // { kind: 'new'|'access'|'rename'|'import', list? }

  const loadLists = () => api.pricelists().then(setLists)
  useEffect(() => { loadLists() }, [])

  if (open) return <Browse list={open} onBack={() => { setOpen(null); loadLists() }} />
  if (!lists) return <Spin />

  return (
    <>
      <div className="flex justify-between items-center mb-3 px-0.5">
        <div className="text-xs font-bold text-slate-600">Price lists</div>
        {staff && (
          <button onClick={() => setModal({ kind: 'new' })}
            className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1">
            <Plus size={13} />New
          </button>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10 bg-white border border-dashed border-slate-200 rounded-xl">
          {staff ? 'No price lists yet. Tap “New” to add one.' : 'No price lists shared with you yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((pl) => (
            <div key={pl.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <button onClick={() => setOpen(pl)} className="w-full flex justify-between items-center text-left">
                <div>
                  <div className="text-[15px] font-semibold">{pl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pl.count} models</div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              {staff && (
                <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 flex-wrap">
                  <Btn icon={UsersIcon} label="Access" onClick={() => setModal({ kind: 'access', list: pl })} />
                  <Btn icon={Upload} label="Import" onClick={() => setModal({ kind: 'import', list: pl })} />
                  <Btn icon={Pencil} label="Rename" onClick={() => setModal({ kind: 'rename', list: pl })} />
                  {isAdmin && <Btn icon={Trash2} label="Delete" red onClick={async () => {
                    if (confirm('Delete “' + pl.name + '” and all its products?')) { await api.deletePricelist(pl.id); loadLists() }
                  }} />}
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
  return (
    <button onClick={onClick}
      className={'text-[11px] font-semibold border rounded-lg px-2.5 py-1 flex items-center gap-1 ' +
        (red ? 'text-red-700 border-red-200' : 'text-slate-600 border-slate-200')}>
      <Icon size={11} />{label}
    </button>
  )
}

// ---- browse a single price list ----
function Browse({ list, onBack }) {
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  useEffect(() => { api.pricelistProducts(list.id).then(setItems).catch(() => setItems([])) }, [list.id])

  const categories = useMemo(() => items ? ['All', ...Array.from(new Set(items.map((p) => p.category)))] : [], [items])
  const filtered = useMemo(() => {
    if (!items) return []
    const n = q.trim().toLowerCase()
    return items.filter((p) => (cat === 'All' || p.category === cat) &&
      (!n || p.model.toLowerCase().includes(n) || (p.description || '').toLowerCase().includes(n)))
  }, [items, q, cat])

  if (!items) return <Spin />
  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">‹ Price lists</button>
      <div className="text-base font-bold mb-3">{list.name}</div>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model…"
          className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-white text-base outline-none focus:border-emerald-500" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={'whitespace-nowrap text-[12px] font-semibold px-3 py-1.5 rounded-full border ' +
              (cat === c ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{c}</button>
        ))}
      </div>
      <div className="text-[11px] text-slate-400 mb-2 px-0.5">{filtered.length} models</div>
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold break-words">{p.model}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.category}{p.description ? ' · ' + p.description : ''}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[15px] font-bold text-emerald-700">{p.dp != null ? inr(p.dp) : '—'}</div>
                <div className="text-[10px] text-slate-400">DP</div>
              </div>
            </div>
            <div className="flex gap-4 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>MRP <b className="text-slate-700">{p.mrp != null ? inr(p.mrp) : '—'}</b></span>
              {p.nlc != null && <span>NLC <b className="text-slate-700">{inr(p.nlc)}</b></span>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ---- parse a file with the chosen format ----
async function parseFile(file, format) {
  const buf = await file.arrayBuffer()
  return format === 'haier' ? parseHaierWorkbook(buf) : parseStandardTemplate(buf)
}

// ---- create a new price list ----
function NewListModal({ onClose, onDone }) {
  const [name, setName] = useState('')
  const [format, setFormat] = useState('haier')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!name.trim()) { setMsg('Enter a name first.'); e.target.value = ''; return }
    setBusy(true); setMsg('')
    try {
      const products = await parseFile(file, format)
      if (!products.length) { setMsg('No products found — check the file/format.'); setBusy(false); return }
      const pl = await api.createPricelist({ name: name.trim(), allowed_user_ids: [] })
      await api.importPricelist(pl.id, products)
      onDone()
    } catch (err) { setMsg('Failed: ' + err.message); setBusy(false) }
  }

  return (
    <Modal title="New price list" onClose={onClose}>
      <Field label="Name" value={name} onChange={setName} />
      <div className="text-xs font-semibold text-slate-600 mb-1.5">File format</div>
      <div className="flex gap-2 mb-3">
        {[['haier', 'Haier file'], ['standard', 'Standard template']].map(([v, l]) => (
          <button key={v} onClick={() => setFormat(v)}
            className={'flex-1 py-2.5 rounded-lg text-[13px] font-semibold border ' +
              (format === v ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
        ))}
      </div>
      {format === 'standard' && (
        <button onClick={downloadTemplate} className="text-[12px] font-semibold text-emerald-700 flex items-center gap-1 mb-3">
          <Download size={13} />Download blank template
        </button>
      )}
      {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={pick} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {busy ? 'Importing…' : 'Choose Excel & create'}
      </button>
    </Modal>
  )
}

// ---- re-import into an existing list ----
function ImportModal({ list, onClose, onDone }) {
  const [format, setFormat] = useState('haier')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setMsg('')
    try {
      const products = await parseFile(file, format)
      if (!products.length) { setMsg('No products found — check the file/format.'); setBusy(false); return }
      await api.importPricelist(list.id, products)
      onDone()
    } catch (err) { setMsg('Failed: ' + err.message); setBusy(false) }
  }
  return (
    <Modal title={'Update “' + list.name + '”'} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">Uploading replaces this list's products.</div>
      <div className="text-xs font-semibold text-slate-600 mb-1.5">File format</div>
      <div className="flex gap-2 mb-3">
        {[['haier', 'Haier file'], ['standard', 'Standard template']].map(([v, l]) => (
          <button key={v} onClick={() => setFormat(v)}
            className={'flex-1 py-2.5 rounded-lg text-[13px] font-semibold border ' +
              (format === v ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
        ))}
      </div>
      {format === 'standard' && (
        <button onClick={downloadTemplate} className="text-[12px] font-semibold text-emerald-700 flex items-center gap-1 mb-3">
          <Download size={13} />Download blank template
        </button>
      )}
      {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={pick} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {busy ? 'Importing…' : 'Choose Excel & replace'}
      </button>
    </Modal>
  )
}

// ---- per-list access: pick which users can see it ----
function AccessModal({ list, onClose, onDone }) {
  const [users, setUsers] = useState(null)
  const [sel, setSel] = useState(new Set(list.allowed_user_ids || []))
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.selectableUsers().then(setUsers) }, [])
  const toggle = (id) => setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const save = async () => { setBusy(true); await api.updatePricelist(list.id, { allowed_user_ids: [...sel] }); onDone() }

  return (
    <Modal title={'Who can see “' + list.name + '”'} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">You (admin) always see every price list.</div>
      {!users ? <Spin /> : (
        <div className="space-y-2 mb-4">
          {users.length === 0 && <div className="text-[12px] text-slate-400">No collectors or managers yet.</div>}
          {users.map((u) => (
            <button key={u.id} onClick={() => toggle(u.id)}
              className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5 bg-white">
              <div className="text-left">
                <div className="text-[13px] font-semibold text-slate-700">{u.name}</div>
                <div className="text-[11px] text-slate-500 capitalize">{u.role}</div>
              </div>
              <div className={'w-11 h-6 rounded-full relative transition-colors ' + (sel.has(u.id) ? 'bg-emerald-600' : 'bg-slate-300')}>
                <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ' + (sel.has(u.id) ? 'left-[22px]' : 'left-0.5')} />
              </div>
            </button>
          ))}
        </div>
      )}
      <button onClick={save} disabled={busy}
        className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy && <Loader2 size={16} className="animate-spin" />}Save access
      </button>
    </Modal>
  )
}

function RenameModal({ list, onClose, onDone }) {
  const [name, setName] = useState(list.name)
  const save = async () => { if (!name.trim()) return; await api.updatePricelist(list.id, { name: name.trim() }); onDone() }
  return (
    <Modal title="Rename price list" onClose={onClose}>
      <Field label="Name" value={name} onChange={setName} />
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-1">Save</button>
    </Modal>
  )
}

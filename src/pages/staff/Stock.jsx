import { useEffect, useState } from 'react'
import { Search, Loader2, Package, Barcode } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { inr } from '../../lib/format.js'
import { Spin, SectionH, RowActions, Modal, Field } from '../../components/ui.jsx'

export default function Stock() {
  const [data, setData] = useState(null)
  const [summary, setSummary] = useState(null)
  const [editing, setEditing] = useState(null)
  const [imei, setImei] = useState('')
  const [lookup, setLookup] = useState(null)
  const [uf, setUf] = useState({ brand: '', status: '', q: '' })
  const [units, setUnits] = useState(null)
  const [agingDays, setAgingDays] = useState(60)
  const [aging, setAging] = useState(null)
  useEffect(() => {
    const p = new URLSearchParams()
    if (uf.brand) p.set('brand', uf.brand)
    if (uf.status) p.set('status', uf.status)
    if (uf.q) p.set('q', uf.q)
    const qs = p.toString()
    api.catalogUnits(qs ? '?' + qs : '').then(setUnits)
  }, [uf])
  useEffect(() => { api.agingStock(agingDays).then(setAging) }, [agingDays])
  const reload = () => { api.stock().then(setData); api.stockSummary().then(setSummary) }
  useEffect(() => { reload() }, [])
  if (!data || !summary) return <Spin />

  const del = async (id) => { if (await confirmDialog('Delete this product?', { danger: true, confirmLabel: 'Delete' })) { await api.delStock(id); reload(); toast.success('Product deleted') } }
  const search = async () => {
    if (!imei.trim()) return
    setLookup({ loading: true })
    try { setLookup({ result: await api.imeiLookup(imei.trim()) }) }
    catch (e) { setLookup({ error: e.message }) }
  }
  const rows = summary.rows || []

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight mb-4">Stock</h1>

      {/* IMEI / serial tracker */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft mb-5">
        <div className="flex items-center gap-2 mb-2.5"><Barcode size={16} className="text-brand-600" /><span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Track by IMEI / serial</span></div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="stock-imei-search" value={imei} onChange={(e) => setImei(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Enter IMEI / serial number…" className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white text-base outline-none focus:border-brand-500 transition-colors" />
          </div>
          <button data-testid="stock-imei-search-btn" onClick={search} className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 rounded-xl transition-colors">Track</button>
        </div>
        {lookup && (
          <div className="mt-3">
            {lookup.loading && <div className="flex items-center gap-2 text-slate-400 text-[13px]"><Loader2 size={14} className="animate-spin" />Searching…</div>}
            {lookup.error && <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{lookup.error}</div>}
            {lookup.result && <ImeiCard u={lookup.result} />}
          </div>
        )}
      </div>

      {(summary.valuation && summary.valuation.length > 0) && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Stock value · available</div>
            <div className="text-[13px] font-bold text-brand-700">{inr(summary.total_value || 0)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {summary.valuation.map((v, i) => (
              <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft">
                <div className="text-[12px] font-semibold text-slate-500 truncate">{v.brand}</div>
                <div className="font-display text-lg font-bold text-slate-900 mt-0.5">{inr(v.value)}</div>
                <div className="text-[11px] text-slate-400">{v.units} unit(s) in stock</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slow / dead stock */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Slow-moving stock</div>
        <select data-testid="aging-days" value={agingDays} onChange={(e) => setAgingDays(+e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-[12px] bg-white">
          <option value={30}>&gt; 30 days</option><option value={60}>&gt; 60 days</option><option value={90}>&gt; 90 days</option>
        </select>
      </div>
      <div className="bg-white border border-slate-200/70 rounded-2xl shadow-soft mb-5 overflow-hidden">
        {!aging ? <div className="text-slate-400 text-[13px] py-4 text-center">Loading…</div>
          : aging.rows.length === 0 ? <div className="text-slate-400 text-[13px] py-6 text-center">Nothing sitting beyond {aging.days} days 🎉</div>
            : <>
              <div className="flex justify-between items-center px-3.5 py-2 bg-amber-50/60 border-b border-amber-100 text-[12px]"><span className="font-semibold text-amber-800">{aging.count} unit(s) aging</span><span className="font-bold text-amber-800">{inr(aging.value)} tied up</span></div>
              {aging.rows.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
                  <div className="min-w-0 pr-2"><div className="font-semibold text-slate-800 truncate">{u.model}</div><div className="text-[11px] text-slate-400 font-mono truncate">{u.imei} · {u.brand}</div></div>
                  <div className="text-right shrink-0"><div className="font-bold text-amber-700">{u.days}d</div><div className="text-[10px] text-slate-400">{u.purchase_date}</div></div>
                </div>
              ))}
            </>}
      </div>

      {/* All units deep search */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">All units</div>
        <div className="text-[12px] text-slate-400">{units ? units.length : 0} shown</div>
      </div>
      <div className="bg-white border border-slate-200/70 rounded-2xl p-3 shadow-soft mb-5">
        <div className="flex flex-wrap gap-2 mb-2">
          <select data-testid="units-brand" value={uf.brand} onChange={(e) => setUf((p) => ({ ...p, brand: e.target.value }))} className="border border-slate-200 rounded-lg px-2 py-2 text-[13px] bg-white">
            <option value="">All brands</option>
            {(summary.brands || []).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select data-testid="units-status" value={uf.status} onChange={(e) => setUf((p) => ({ ...p, status: e.target.value }))} className="border border-slate-200 rounded-lg px-2 py-2 text-[13px] bg-white">
            <option value="">In stock + sold</option>
            <option value="in_stock">In stock</option>
            <option value="sold">Sold</option>
          </select>
          <div className="relative flex-1 min-w-[8rem]">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="units-search" value={uf.q} onChange={(e) => setUf((p) => ({ ...p, q: e.target.value }))} placeholder="Model or IMEI…" className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-[13px] bg-white outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 -mx-1">
          {!units ? <div className="text-slate-400 text-[13px] py-4 text-center">Loading…</div>
            : units.length === 0 ? <div className="text-slate-400 text-[13px] py-4 text-center">No units match.</div>
              : units.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-1 py-2 text-[13px]">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-800 truncate">{u.model}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{u.imei}</div>
                  </div>
                  <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 shrink-0 ' + (u.status === 'sold' ? 'text-slate-600 bg-slate-100 ring-slate-200' : 'text-brand-700 bg-brand-50 ring-brand-100')}>{u.status === 'sold' ? 'Sold' : 'In stock'}</span>
                </div>
              ))}
        </div>
      </div>

      {/* Imported inventory (unit / qty tracked) */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Inventory · available</div>
        <div className="text-[12px] font-semibold text-slate-500">{rows.reduce((s, r) => s + r.available, 0)} in stock</div>
      </div>
      {rows.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-8 bg-white border border-dashed border-slate-200 rounded-2xl mb-6">No imported stock yet. Use <b>Imports → Purchase CSV</b> to stock in.</div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 mb-6">
          {rows.map((r, i) => {
            const c = r.available === 0 ? 'text-red-700' : r.available <= 3 ? 'text-amber-700' : 'text-slate-900'
            return (
              <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <div className="text-[13.5px] font-semibold text-slate-900 truncate">{r.model}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.brand}{r.group ? ' · ' + r.group : ''} · <span className="uppercase">{r.tracked}</span></div>
                </div>
                <div className="text-right shrink-0"><div className={'font-display text-lg font-extrabold ' + c}>{r.available}</div><div className="text-[10px] text-slate-400">of {r.total}</div></div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manual quick products */}
      <SectionH onAdd={() => setEditing({})}>Manual products</SectionH>
      {data.length === 0 && <div className="text-center text-slate-400 text-sm py-8 bg-white border border-dashed border-slate-200 rounded-2xl">No manual products. Tap “Add” for quick items, or import a purchase CSV above.</div>}
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {data.map((s) => {
          const c = s.qty === 0 ? 'text-red-700' : s.qty <= 8 ? 'text-amber-700' : ''
          const tag = s.qty === 0 ? 'Out' : s.qty <= 8 ? 'Low' : 'In stock'
          return (
            <div key={s.id} className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft flex justify-between items-center">
              <div>
                <div className="text-[14px] font-semibold text-slate-900">{s.name}</div>
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

function ImeiCard({ u }) {
  const sold = u.status === 'sold'
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[12px] font-semibold text-slate-700 truncate pr-2">{u.imei}</div>
        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ' + (sold ? 'text-slate-600 bg-slate-100 ring-slate-200' : 'text-brand-700 bg-brand-50 ring-brand-100')}>{sold ? 'Sold' : 'In stock'}</span>
      </div>
      <div className="text-[13px] font-semibold text-slate-900 mt-1">{u.model}</div>
      <div className="text-[11px] text-slate-400">{u.brand}{u.group ? ' · ' + u.group : ''}</div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[12px]">
        <div><div className="text-[10px] uppercase tracking-wide text-slate-400">Purchased</div><div className="text-slate-700">{u.purchase_bill ? `${u.purchase_bill} · ${u.purchase_date || ''}` : '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wide text-slate-400">Sold to</div><div className="text-slate-700">{sold ? `${u.sale_dealer_name || '—'} · ${u.sale_date || ''}` : '—'}</div></div>
      </div>
    </div>
  )
}

function StockForm({ item, onClose, onSaved }) {
  const [f, setF] = useState({ name: item.name || '', price: item.price || '', qty: item.qty ?? '' })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.name.trim()) return toast.error('Name is required')
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
      <button onClick={save} className="w-full bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-semibold py-3 rounded-xl mt-2 shadow-glow transition-all">Save</button>
    </Modal>
  )
}

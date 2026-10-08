import { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { toast } from '../../lib/toast.js'
import { Modal, Field, Spin } from '../../components/ui.jsx'
import { confirmDialog } from '../../lib/confirm.js'

const k = (r) => (r.brand || '') + '|' + r.model

export function NoCostFixer({ from, to, brand, onClose, onSaved }) {
  const [rows, setRows] = useState(null)
  const [vals, setVals] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { api.reportProfit2NoCost(from, to, brand).then((x) => setRows(x.rows || [])) }, [from, to, brand])
  const save = async () => {
    const items = (rows || []).map((r) => ({ brand: r.brand, model: r.model, nlc: +(vals[k(r)] ?? r.override_nlc) || 0 })).filter((i) => i.nlc > 0)
    if (!items.length) { toast('Enter a cost (NLC) for at least one model'); return }
    setSaving(true)
    try {
      const res = await api.costOverrideSaveBulk(items)
      toast('Saved cost for ' + (res.saved || items.length) + ' model(s)')
      onSaved && onSaved()
    } catch (e) { toast(e.message || 'Save failed — admin only') } finally { setSaving(false) }
  }
  return (
    <Modal title="Set cost (NLC) for units with no purchase" onClose={onClose}>
      {!rows ? <Spin /> : rows.length === 0 ? (
        <div data-testid="nocost-empty" className="text-[13px] text-slate-500 py-6 text-center">Nothing to fix — every sold unit in this range already has a cost.</div>
      ) : (
        <>
          <div className="text-[12px] text-slate-500 mb-3">Enter the cost per unit (NLC). It's used only when no purchase record exists — any real purchase imported later overrides it automatically.</div>
          <div className="space-y-2 max-h-[52vh] overflow-auto pr-1">
            {rows.map((r) => (
              <div key={k(r)} data-testid={'nocost-row-' + r.model} className="flex items-center gap-3 border border-slate-100 rounded-xl p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{r.model}</div>
                  <div className="text-[11px] text-slate-500">{r.brand} · {r.units} units · sold {inr(r.sale)} · avg rate {inr(r.avg_rate)}</div>
                </div>
                <input data-testid={'nocost-nlc-' + r.model} type="number" placeholder="NLC ₹"
                  defaultValue={r.override_nlc || ''} onChange={(e) => setVals((v) => ({ ...v, [k(r)]: e.target.value }))}
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[13px] text-right" />
              </div>
            ))}
          </div>
          <button data-testid="nocost-save-btn" disabled={saving} onClick={save}
            className="mt-4 w-full bg-slate-900 text-white rounded-xl py-2.5 text-[14px] font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save costs'}</button>
        </>
      )}
    </Modal>
  )
}

function EditNlc({ row, onSaved }) {
  const [v, setV] = useState(row.nlc)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (+v === row.nlc || !(+v > 0)) return
    setBusy(true)
    try { await api.costOverrideSave({ brand: row.brand, model: row.model, nlc: +v }); toast('Updated'); onSaved() }
    catch (e) { toast(e.message || 'Admin only') } finally { setBusy(false) }
  }
  return <input data-testid={'co-nlc-' + row.model} type="number" value={v} disabled={busy}
    onChange={(e) => setV(e.target.value)} onBlur={save}
    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-[13px] text-right" />
}

function AddOverride({ onClose, onSaved }) {
  const [f, setF] = useState({ brand: '', model: '', nlc: '' })
  const save = async () => {
    if (!f.model.trim() || !(+f.nlc > 0)) { toast('Enter model and a valid NLC'); return }
    try { await api.costOverrideSave({ brand: f.brand.trim(), model: f.model.trim(), nlc: +f.nlc }); toast('Saved'); onSaved() }
    catch (e) { toast(e.message || 'Admin only') }
  }
  return (
    <Modal title="Add manual cost (NLC)" onClose={onClose}>
      <Field label="Brand" value={f.brand} onChange={(v) => setF({ ...f, brand: v })} placeholder="HAIER" />
      <Field label="Model (exact name as in sales)" value={f.model} onChange={(v) => setF({ ...f, model: v })} placeholder="Model name" />
      <Field label="NLC (cost per unit) ₹" value={f.nlc} onChange={(v) => setF({ ...f, nlc: v })} type="number" big />
      <button data-testid="co-save-btn" onClick={save} className="mt-4 w-full bg-slate-900 text-white rounded-xl py-2.5 text-[14px] font-semibold">Save</button>
    </Modal>
  )
}

export function CostOverridesManager() {
  const [rows, setRows] = useState(null)
  const [add, setAdd] = useState(false)
  const load = () => api.costOverrides().then((x) => setRows(x.rows || []))
  useEffect(() => { load() }, [])
  const del = async (r) => {
    if (!(await confirmDialog('Remove manual cost for ' + r.model + '?'))) return
    try { await api.costOverrideDelete(r.id); toast('Removed'); load() } catch (e) { toast(e.message || 'Admin only') }
  }
  if (!rows) return <Spin />
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[12px] text-slate-500 max-w-[66%]">Manual costs (NLC) for models with no purchase record. A real purchase always overrides these automatically.</div>
        <button data-testid="co-add-btn" onClick={() => setAdd(true)} className="shrink-0 text-[12px] font-semibold text-white bg-slate-900 rounded-full px-3 py-1.5 flex items-center gap-1"><Plus size={13} />Add</button>
      </div>
      {rows.length === 0 ? <div data-testid="co-empty" className="text-[13px] text-slate-500 py-10 text-center">No manual costs set yet. Set them from the "Units sold with no purchase cost" alert on Profit&nbsp;2.</div> : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {rows.map((r) => (
            <div key={r.id} data-testid={'co-row-' + r.model} className="flex items-center gap-3 px-3 py-2.5 border-t border-slate-50 first:border-t-0">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-800 truncate">{r.model}{r.brand && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 ml-1.5">{r.brand}</span>}</div>
                <div className="text-[11px] text-slate-400">NLC {inr(r.nlc)}{r.updated_by ? ' · by ' + r.updated_by : ''}</div>
              </div>
              <EditNlc row={r} onSaved={load} />
              <button data-testid={'co-del-' + r.model} onClick={() => del(r)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      {add && <AddOverride onClose={() => setAdd(false)} onSaved={() => { setAdd(false); load() }} />}
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Target, Plus, Flame } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { exportSheet } from '../../lib/excel.js'
import { waLink } from '../../lib/whatsapp.js'
import { toast } from '../../lib/toast.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin, Card, Modal, Field, Select, RowActions } from '../../components/ui.jsx'
import { Big, ExportBtn, Section, Search } from '../../components/reportBits.jsx'
import { confirmDialog } from '../../lib/confirm.js'

const today = () => new Date().toISOString().slice(0, 10)
const STATUS = {
  done: ['Achieved', 'bg-emerald-100 text-emerald-700', 'bg-emerald-500'],
  behind: ['Behind', 'bg-red-100 text-red-700', 'bg-red-500'],
  'on-track': ['On track', 'bg-amber-100 text-amber-800', 'bg-amber-500'],
  upcoming: ['Upcoming', 'bg-sky-100 text-sky-700', 'bg-sky-400'],
  expired: ['Ended', 'bg-slate-200 text-slate-600', 'bg-slate-400'],
}

function useTargets() {
  const [data, setData] = useState(null)
  const load = () => api.targetsList().then(setData)
  useEffect(() => { load() }, [])
  return [data, load]
}

function TargetBar({ r }) {
  const s = STATUS[r.status] || STATUS['on-track']
  const pct = Math.max(0, Math.min(100, r.achieved_pct || 0))
  return (
    <>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
        <div className={'h-full rounded-full ' + s[2]} style={{ width: pct + '%' }} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-slate-600">
        <span><b className="text-slate-900">{inr(r.basic_achieved)}</b> / {inr(r.target_value)} ({r.achieved_pct}%)</span>
        {!r.done && <span>· <b className="text-slate-900">{inr(r.remaining)}</b> to go</span>}
        {!r.expired && <span>· {r.days_left}d left</span>}
        {r.reward_type && <span className="font-semibold text-emerald-700">· {r.done ? 'reward ' + inr(r.reward_target) + ' earned' : (r.reward_type === 'flat' ? inr(r.reward_target) + ' reward' : r.reward_value + '% reward')}</span>}
        <span className="text-slate-400">· {r.date_from} → {r.date_to}</span>
      </div>
    </>
  )
}

export function TargetBoard() {
  const { auth } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [data, load] = useTargets()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null) // {} new or row edit
  const [dealers, setDealers] = useState([])
  useEffect(() => { if (isAdmin) api.dealers().then(setDealers) }, [isAdmin])

  if (!data) return <Spin />
  const rows = data.rows.filter((r) => !q || (r.dealer_name || '').toLowerCase().includes(q.toLowerCase()) || (r.name || '').toLowerCase().includes(q.toLowerCase()))
  const s = data.summary || {}

  const del = async (r) => {
    if (await confirmDialog('Delete target "' + r.name + '" for ' + r.dealer_name + '?', { danger: true, confirmLabel: 'Delete' })) {
      await api.targetDelete(r.id); toast.success('Target removed'); load()
    }
  }
  const exportXl = () => {
    const aoa = [['Dealer', 'Target', 'Target value', 'GST %', 'Basic done', 'Achieved %', 'Remaining', 'Status', 'From', 'To']]
    rows.forEach((r) => aoa.push([r.dealer_name, r.name, r.target_value, r.gst_pct, r.basic_achieved, r.achieved_pct, r.remaining, (STATUS[r.status] || [])[0], r.date_from, r.date_to]))
    exportSheet('dealer-targets.xlsx', aoa)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Card n={s.active || 0} l="Active targets" />
        <Card n={s.behind || 0} l="Behind pace" tone={s.behind ? 'text-red-600' : ''} />
        <Card n={inr(s.achieved_total || 0)} l="Basic achieved (active)" />
        <Card n={inr(s.target_total || 0)} l="Target total (active)" />
      </div>
      <div className="flex gap-2 mb-3">
        <Search value={q} onChange={setQ} placeholder="Search dealer or target…" />
        {isAdmin && <button data-testid="add-target-btn" onClick={() => setForm({})} className="shrink-0 bg-gradient-to-b from-amber-500 to-orange-600 text-white text-[13px] font-semibold px-3.5 rounded-lg flex items-center gap-1"><Plus size={15} />New target</button>}
        {rows.length > 0 && <ExportBtn onClick={exportXl} />}
      </div>

      {!rows.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Target size={28} className="mx-auto text-amber-500 mb-2" />
          <div className="font-display font-bold text-slate-800">No targets yet</div>
          <div className="text-[12px] text-slate-500 mt-1">{isAdmin ? 'Set a Diwali / festival target for a dealer — everyone can then push them to hit it.' : 'No targets set for your dealers right now.'}</div>
        </div>
      ) : rows.map((r) => {
        const s2 = STATUS[r.status] || STATUS['on-track']
        return (
          <div key={r.id} data-testid={'target-row-' + r.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-2.5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-[15px] font-bold text-slate-900 truncate">{r.dealer_name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1"><Flame size={11} className="text-amber-500" />{r.name}{r.brand && <span className="ml-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wide">{r.brand}</span>}</div>
              </div>
              <span className={'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ' + s2[1]}>{s2[0]}</span>
            </div>
            <TargetBar r={r} />
            <div className="flex items-center justify-between mt-1">
              {r.phone ? <a href={waLink(r.phone, `Hi ${r.dealer_name}, aapka ${r.name} target ${inr(r.target_value)} ka hai. Abhi tak ${inr(r.basic_achieved)} (${r.achieved_pct}%) hua hai, ${inr(r.remaining)} aur baaki — chaliye poora karte hain!`)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#075E54]">WhatsApp push →</a> : <span />}
              {isAdmin && <RowActions onEdit={() => setForm(r)} onDel={() => del(r)} />}
            </div>
          </div>
        )
      })}

      {form && <TargetForm row={form.id ? form : null} dealers={dealers} brands={data.brands || []} onClose={() => setForm(null)} onSaved={() => { setForm(null); load() }} />}
    </>
  )
}

function TargetForm({ row, dealers, brands = [], onClose, onSaved }) {
  const [f, setF] = useState({
    dealer_id: row?.dealer_id || '', name: row?.name || '', brand: row?.brand || '',
    target_value: row?.target_value || '', gst_pct: row?.gst_pct ?? 18,
    date_from: row?.date_from || today(), date_to: row?.date_to || today(), note: row?.note || '',
    reward_type: row?.reward_type || '', reward_value: row?.reward_value || '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!row && !f.dealer_id) return toast.error('Pick a dealer')
    if (!f.name.trim()) return toast.error('Name the target')
    if (!(+f.target_value > 0)) return toast.error('Target value must be > 0')
    if (f.date_from > f.date_to) return toast.error('End date must be after start')
    setBusy(true)
    try {
      const body = { name: f.name.trim(), target_value: +f.target_value, gst_pct: +f.gst_pct || 0, date_from: f.date_from, date_to: f.date_to, note: f.note.trim(), brand: (f.brand || '').trim(), reward_type: f.reward_type || '', reward_value: +f.reward_value || 0 }
      if (row) await api.targetUpdate(row.id, body)
      else await api.targetCreate({ ...body, dealer_id: f.dealer_id })
      toast.success(row ? 'Target updated' : 'Target set')
      onSaved()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={row ? 'Edit target' : 'New dealer target'} onClose={onClose}>
      {!row && <Select label="Dealer" value={f.dealer_id} onChange={(v) => set('dealer_id', v)} testid="target-dealer"
        options={[['', 'Select dealer…'], ...dealers.map((d) => [d.id, d.name])]} />}
      {row && <div className="mb-3 text-[13px] font-semibold text-slate-700">{row.dealer_name}</div>}
      <Field label="Target name" value={f.name} onChange={(v) => set('name', v)} placeholder="Diwali 2026" />
      <Select label="Brand" value={f.brand} onChange={(v) => set('brand', v)} testid="target-brand"
        options={[['', 'All brands (whole ledger value)'], ...brands.map((b) => [b, b])]} />
      <Field label="Target value (basic, before GST) ₹" value={f.target_value} onChange={(v) => set('target_value', v)} type="number" big />
      <Field label="GST % to strip (use 0 if brand sales are already ex-GST)" value={f.gst_pct} onChange={(v) => set('gst_pct', v)} type="number" placeholder="18" />
      <Select label="Dealer reward on hitting target" value={f.reward_type} onChange={(v) => set('reward_type', v)} testid="target-reward-type"
        options={[['', 'No reward'], ['flat', 'Flat ₹ bonus'], ['pct', '% of sales']]} />
      {f.reward_type && <Field label={f.reward_type === 'flat' ? 'Reward amount ₹' : 'Reward %'} value={f.reward_value} onChange={(v) => set('reward_value', v)} type="number" />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" value={f.date_from} onChange={(v) => set('date_from', v)} type="date" />
        <Field label="To" value={f.date_to} onChange={(v) => set('date_to', v)} type="date" />
      </div>
      <Field label="Note (optional)" value={f.note} onChange={(v) => set('note', v)} />
      <button data-testid="save-target-btn" disabled={busy} onClick={save} className="w-full bg-gradient-to-b from-amber-500 to-orange-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60 mt-1">{busy ? 'Saving…' : row ? 'Save target' : 'Set target'}</button>
    </Modal>
  )
}

// Collector push list — dealers behind pace, nearest-to-slip first, with a one-tap WhatsApp nudge.
export function TargetPush() {
  const [data] = useTargets()
  if (!data) return <Spin />
  const rows = (data.rows || []).filter((r) => r.started && !r.done && !r.expired).sort((a, b) => (a.achieved_pct - a.elapsed_pct) - (b.achieved_pct - b.elapsed_pct))
  const behind = rows.filter((r) => r.behind)
  return (
    <>
      <Big label="Dealers to push today (behind or close to slipping)" value={rows.length} tone={behind.length ? 'text-red-600' : 'text-amber-600'} />
      {!rows.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-[13px] text-slate-500">
          <Target size={26} className="mx-auto text-emerald-500 mb-2" />All running targets are on track. 🎯
        </div>
      ) : rows.map((r) => {
        const gap = Math.round(r.elapsed_pct - r.achieved_pct)
        return (
          <div key={r.id} data-testid={'push-row-' + r.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-2.5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-[15px] font-bold text-slate-900 truncate">{r.dealer_name}</div>
                <div className="text-[11px] text-slate-500">{r.name} · {inr(r.remaining)} to go · {r.days_left}d left</div>
              </div>
              <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ' + (r.behind ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800')}>{gap > 0 ? gap + '% behind pace' : 'watch'}</span>
            </div>
            <TargetBar r={r} />
            {r.phone && <a href={waLink(r.phone, `Hi ${r.dealer_name}, ${r.name} target me ${inr(r.remaining)} aur baaki hai (${r.days_left} din left). Aaj order plan karein?`)} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[12px] font-semibold text-white bg-[#25D366] px-3 py-1.5 rounded-lg">WhatsApp nudge</a>}
          </div>
        )
      })}
    </>
  )
}

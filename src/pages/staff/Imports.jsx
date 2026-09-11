import { useState, useEffect } from 'react'
import { UploadCloud, ShoppingCart, PackagePlus, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, Undo2 } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Modal } from '../../components/ui.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { confirmDialog } from '../../lib/confirm.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function parseRaw(raw, fmt) {
  if (!raw) return null
  const p = String(raw).replace(/\//g, '-').split('-')
  if (p.length !== 3) return null
  let [a, b, c] = p, dd, mm, yy
  if (a.length === 4) { yy = a; mm = b; dd = c }
  else if (fmt === 'mdy') { mm = a; dd = b; yy = c }
  else { dd = a; mm = b; yy = c }
  yy = yy.length === 2 ? '20' + yy : yy
  return { y: parseInt(yy, 10), m: parseInt(mm, 10), d: parseInt(dd, 10) }
}
function fmtRaw(raw, fmt) {
  const o = parseRaw(raw, fmt)
  if (!o || !o.m || o.m < 1 || o.m > 12) return raw || '—'
  return `${o.d} ${MONTHS[o.m - 1]} ${o.y}`
}
function toISO(raw, fmt) {
  const o = parseRaw(raw, fmt)
  if (!o || !o.m) return null
  return `${o.y}-${String(o.m).padStart(2, '0')}-${String(o.d).padStart(2, '0')}`
}
function rawRange(raws, fmt) {
  const arr = raws.map((r) => ({ r, iso: toISO(r, fmt) })).filter((x) => x.iso).sort((a, b) => (a.iso < b.iso ? -1 : 1))
  return arr.length ? [arr[0].r, arr[arr.length - 1].r] : []
}
function DateFormatBar({ dateInfo, fmt, setFmt }) {
  if (!dateInfo) return null
  const sample = dateInfo.sample
  return (
    <div className={'mb-3 rounded-xl px-3 py-2.5 border text-[12px] ' + (dateInfo.ambiguous ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200')}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-700">Confirm bill-date format</div>
        <select data-testid="date-format-select" value={fmt} onChange={(e) => setFmt(e.target.value)}
          className="text-[12px] font-semibold border border-slate-300 rounded-lg px-2 py-1 bg-white">
          <option value="dmy">DD-MM-YYYY</option>
          <option value="mdy">MM-DD-YYYY</option>
        </select>
      </div>
      <div className="mt-1 text-slate-500">Reading <b className="text-slate-700">{sample || '—'}</b> as <b data-testid="date-format-preview" className="text-slate-800">{fmtRaw(sample, fmt)}</b></div>
      {dateInfo.ambiguous && <div className="mt-1 flex items-center gap-1.5 text-amber-800 font-semibold"><AlertTriangle size={13} /> Dates are ambiguous — please pick the correct format before posting.</div>}
    </div>
  )
}

export default function Imports() {
  const [refresh, setRefresh] = useState(0)
  const bump = () => setRefresh((r) => r + 1)
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Imports</h1>
      <p className="text-[13px] text-slate-500 mb-6 max-w-xl">Import MARG <b>Sale</b> &amp; <b>Purchase</b> files (CSV, XLS or XLSX). The brand is read from the file, so any brand works — with or without IMEI/serial numbers.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <SaleImport onImported={bump} />
        <PurchaseImport onImported={bump} />
      </div>
      <RecentImports refresh={refresh} onChanged={bump} />
    </>
  )
}

function RecentImports({ refresh, onChanged }) {
  const { auth } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [rows, setRows] = useState(null)
  useEffect(() => { api.importBatches().then(setRows).catch(() => setRows([])) }, [refresh])
  if (!rows || !rows.length) return null
  const undo = async (b) => {
    if (!(await confirmDialog('Undo this ' + b.kind + ' import (' + (b.filename || b.brand || '') + ')? This removes the bills and stock it added.', { danger: true, confirmLabel: 'Undo import' }))) return
    try { await api.undoImport(b.id); toast.success('Import undone'); onChanged?.() } catch (e) { toast.error(e.message) }
  }
  return (
    <div className="mt-6" data-testid="recent-imports">
      <h2 className="font-display text-[15px] font-bold text-slate-900 mb-2">Recent imports</h2>
      <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-50 shadow-soft overflow-hidden">
        {rows.map((b) => {
          const c = b.counts || {}
          const sub = b.kind === 'sale'
            ? `${c.bills_added || 0} bills · ${c.dealers_created || 0} new dealers · ${c.units_sold || 0} sold`
            : `${c.units_added || 0} units · ${c.qty_added || 0} qty`
          return (
            <div key={b.id} data-testid={'import-batch-' + b.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 pr-2">
                <div className="text-[13px] font-semibold text-slate-800 truncate flex items-center gap-1.5">
                  <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded ' + (b.kind === 'sale' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600')}>{(b.kind || '').toUpperCase()}</span>
                  {b.filename || (b.brand + ' ' + b.kind)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{sub} · {(b.created_at || '').slice(0, 10)}</div>
              </div>
              {isAdmin && <button data-testid={'undo-import-' + b.id} onClick={() => undo(b)} className="shrink-0 text-[12px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors"><Undo2 size={13} />Undo</button>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Dropzone({ testid, onFile, busy, icon: Icon, title, hint }) {
  const pick = (e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }
  return (
    <label className="group flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl py-8 px-4 cursor-pointer bg-slate-50/60 hover:bg-brand-50/40 transition-colors">
      <input data-testid={testid} type="file" accept=".csv,.txt,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/csv" onChange={pick} className="hidden" disabled={busy} />
      <div className="w-12 h-12 rounded-2xl bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
        {busy ? <Loader2 size={22} className="text-brand-600 animate-spin" /> : <Icon size={22} className="text-brand-600" />}
      </div>
      <div className="font-display text-[14px] font-bold text-slate-700">{title}</div>
      <div className="text-[12px] text-slate-400 mt-0.5">{hint}</div>
    </label>
  )
}

function Card({ icon: Icon, tone, title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-3 mb-4">
        <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + tone}><Icon size={19} /></div>
        <div><div className="font-display text-[15px] font-bold text-slate-900">{title}</div><div className="text-[12px] text-slate-400">{subtitle}</div></div>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  return <div className="bg-slate-50 rounded-xl px-3 py-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className={'font-display text-lg font-bold ' + tone}>{value}</div></div>
}

function ResultBox({ lines, onReset }) {
  return (
    <div className="border border-brand-100 bg-brand-50/60 rounded-2xl p-4 text-center">
      <CheckCircle2 size={28} className="text-brand-600 mx-auto mb-2" />
      <div className="font-display font-bold text-slate-800 mb-2">Import complete</div>
      <div className="space-y-1 text-[13px] text-slate-600">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <button onClick={onReset} className="mt-4 text-[12px] font-semibold text-brand-700 hover:underline">Import another file</button>
    </div>
  )
}

function ErrBox({ msg, onRetry }) {
  return (
    <div className="mt-3 flex items-start gap-2 text-[12px] text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <div><div className="font-semibold">Import failed</div><div className="mt-0.5 break-words">{msg}</div>{onRetry && <button onClick={onRetry} className="mt-1 font-semibold text-red-700 hover:underline">Dismiss</button>}</div>
    </div>
  )
}

function SaleImport({ onImported }) {
  const [busy, setBusy] = useState(false)
  const [pv, setPv] = useState(null)
  const [file, setFile] = useState(null)
  const [done, setDone] = useState(null)
  const [err, setErr] = useState(null)
  const [dfmt, setDfmt] = useState('dmy')
  const onFile = async (f) => {
    setFile(f); setBusy(true); setDone(null); setErr(null)
    try { const p = await api.importSalePreview(f); setDfmt(p.date_info?.detected === 'mdy' ? 'mdy' : 'dmy'); setPv(p) } catch (e) { setErr(e.message); toast.error(e.message) }
    setBusy(false)
  }
  const commit = async () => {
    setBusy(true); setErr(null)
    try { const r = await api.importSaleCommit(file, dfmt); setDone(r); setPv(null); toast.success('Sale imported to ledger'); onImported?.() }
    catch (e) { setErr(e.message); toast.error(e.message) }
    setBusy(false)
  }
  return (
    <Card icon={ShoppingCart} tone="bg-brand-600 text-white" title="Sale CSV" subtitle="Auto-feeds matched dealer ledgers + marks stock sold">
      {done ? (
        <ResultBox onReset={() => setDone(null)} lines={[
          `${done.bills_added} bill(s) posted to ledgers`,
          `${done.dealers_created || 0} new dealer(s) created · ${done.skipped_duplicates} duplicate(s) · ${done.skipped_unmatched} unposted`,
          `${done.units_sold} unit(s) marked sold${done.qty_sold ? ` · ${done.qty_sold} qty` : ''}`,
        ]} />
      ) : (
        <Dropzone testid="sale-file-input" onFile={onFile} busy={busy} icon={UploadCloud} title="Choose Sale file" hint="CSV / XLS / XLSX · e.g. SALE HAIER.xlsx" />
      )}
      {err && <ErrBox msg={err} onRetry={() => setErr(null)} />}
      {pv && <SalePreview pv={pv} busy={busy} fmt={dfmt} setFmt={setDfmt} onClose={() => setPv(null)} onConfirm={commit} />}
    </Card>
  )
}

function SalePreview({ pv, busy, fmt, setFmt, onClose, onConfirm }) {
  const s = pv.summary
  return (
    <Modal title={`Review sale import${pv.brand ? ' · ' + pv.brand : ''}`} onClose={onClose}>
      <DateFormatBar dateInfo={pv.date_info} fmt={fmt} setFmt={setFmt} />
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Will post" value={s.will_post} tone="text-brand-700" />
        <Stat label="New dealers" value={s.to_create} tone="text-emerald-700" />
        <Stat label="Duplicates" value={s.duplicates} tone="text-slate-500" />
      </div>
      <div className="text-[12px] text-slate-500 mb-2">Ledger total to post: <b className="text-slate-800">{inr(s.matched_total)}</b> · {s.total_units} unit(s)</div>
      <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
        {pv.bills.map((b) => (
          <div key={b.bill_no} data-testid={'sale-bill-' + b.bill_no} className="flex items-center justify-between px-3 py-2 text-[13px]">
            <div className="min-w-0 pr-2">
              <div className="font-semibold text-slate-800 truncate">{b.party}</div>
              <div className="text-[11px] text-slate-400">Bill {b.bill_no} · {fmtRaw(b.date_raw, fmt)} · {b.lines} line(s)</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-slate-900">{inr(b.total)}</span>
              {b.duplicate ? <Badge tone="slate">Duplicate</Badge> : b.matched ? <Badge tone="brand">Post</Badge> : b.new_dealer ? <Badge tone="emerald">New</Badge> : <Badge tone="amber">Skip</Badge>}
            </div>
          </div>
        ))}
      </div>
      {s.to_create > 0 && <div className="flex items-start gap-2 mt-3 text-[12px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /><span><b>{s.to_create}</b> new dealer(s) will be created automatically from their mobile number, then their bills posted.</span></div>}
      {s.unmatched > 0 && <div className="flex items-start gap-2 mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><b>{s.unmatched}</b> bill(s) have no party name and can't be posted.</span></div>}
      {s.unknown_serials > 0 && <div className="flex items-start gap-2 mt-2 text-[12px] text-orange-800 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><b>{s.unknown_serials}</b> IMEI(s) here were never purchased/stocked{s.unknown_sample?.length ? ` (e.g. ${s.unknown_sample.slice(0, 3).join(', ')})` : ''}. They'll still be recorded as sold — verify these serials.</span></div>}
      <button data-testid="sale-confirm-btn" onClick={onConfirm} disabled={busy || s.will_post === 0}
        className="w-full mt-4 bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-glow transition-all">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Post {s.will_post} bill(s) &amp; mark stock sold
      </button>
    </Modal>
  )
}

function PurchaseImport({ onImported }) {
  const [busy, setBusy] = useState(false)
  const [pv, setPv] = useState(null)
  const [file, setFile] = useState(null)
  const [done, setDone] = useState(null)
  const [err, setErr] = useState(null)
  const [dfmt, setDfmt] = useState('dmy')
  const onFile = async (f) => {
    setFile(f); setBusy(true); setDone(null); setErr(null)
    try { const p = await api.importPurchasePreview(f); setDfmt(p.date_info?.detected === 'mdy' ? 'mdy' : 'dmy'); setPv(p) } catch (e) { setErr(e.message); toast.error(e.message) }
    setBusy(false)
  }
  const commit = async () => {
    setBusy(true); setErr(null)
    try { const r = await api.importPurchaseCommit(file, dfmt); setDone(r); setPv(null); toast.success('Purchase added to stock'); onImported?.() }
    catch (e) { setErr(e.message); toast.error(e.message) }
    setBusy(false)
  }
  return (
    <Card icon={PackagePlus} tone="bg-slate-900 text-white" title="Purchase CSV" subtitle="Adds units to stock (by IMEI) for inventory & reports">
      {done ? (
        <ResultBox onReset={() => setDone(null)} lines={[
          `${done.units_added} IMEI unit(s) added to stock`,
          done.qty_added ? `${done.qty_added} qty added (non-IMEI models)` : null,
          `${done.duplicates} duplicate IMEI(s) skipped`,
        ].filter(Boolean)} />
      ) : (
        <Dropzone testid="purchase-file-input" onFile={onFile} busy={busy} icon={FileSpreadsheet} title="Choose Purchase file" hint="CSV / XLS / XLSX · e.g. PURCHASE HAIER.xlsx" />
      )}
      {err && <ErrBox msg={err} onRetry={() => setErr(null)} />}
      {pv && <PurchasePreview pv={pv} busy={busy} fmt={dfmt} setFmt={setDfmt} onClose={() => setPv(null)} onConfirm={commit} />}
    </Card>
  )
}

function PurchasePreview({ pv, busy, fmt, setFmt, onClose, onConfirm }) {
  const s = pv.summary
  const [dfrom, dto] = rawRange(pv.date_info?.raws || [], fmt)
  return (
    <Modal title={`Review purchase${pv.brand ? ' · ' + pv.brand : ''}`} onClose={onClose}>
      <DateFormatBar dateInfo={pv.date_info} fmt={fmt} setFmt={setFmt} />
      <div className="text-[12px] text-slate-500 mb-3">From <b className="text-slate-700">{pv.supplier || '—'}</b>{dfrom ? ` · ${fmtRaw(dfrom, fmt)} → ${fmtRaw(dto, fmt)}` : ''}</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="IMEI units" value={s.imei_units} tone="text-brand-700" />
        <Stat label="Qty-only" value={s.qty_only} />
        <Stat label="Duplicates" value={s.duplicates} tone="text-slate-500" />
      </div>
      <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Purchase value</div><div className="font-display text-xl font-bold text-slate-900">{inr(s.total)}</div></div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">By category</div>
      <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
        {(pv.categories || []).map((c, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
            <div className="font-semibold text-slate-700 truncate pr-2">{c.group} <span className="text-slate-400 font-normal">· {c.qty}</span></div>
            <span className="font-bold text-slate-900 shrink-0">{inr(c.amount)}</span>
          </div>
        ))}
      </div>
      <button data-testid="purchase-confirm-btn" onClick={onConfirm} disabled={busy || (s.imei_units === 0 && s.qty_only === 0)}
        className="w-full mt-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}Add {s.imei_units || s.qty_only} to stock
      </button>
    </Modal>
  )
}

function Badge({ tone, children }) {
  const map = { brand: 'text-brand-700 bg-brand-50 ring-brand-100', amber: 'text-amber-700 bg-amber-50 ring-amber-100', emerald: 'text-emerald-700 bg-emerald-50 ring-emerald-100', slate: 'text-slate-500 bg-slate-100 ring-slate-200' }
  return <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ' + map[tone]}>{children}</span>
}

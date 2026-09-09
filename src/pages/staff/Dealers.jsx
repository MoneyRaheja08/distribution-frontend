import { useEffect, useRef, useState } from 'react'
import { Loader2, Upload, FileText, Download, Search, ChevronRight, Store, GitMerge } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { inr } from '../../lib/format.js'
import { parseStatement, parseBulkBills, downloadBillsTemplate } from '../../lib/statement.js'
import { Spin, SectionH, RowActions, Pill, Modal, Field, Select, SkeletonList, Card, EmptyState } from '../../components/ui.jsx'
import { LedgerHeader, LedgerTable } from '../../components/Ledger.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { waLink, reminderText } from '../../lib/whatsapp.js'
import { getPosition } from '../../lib/geo.js'
import { renderLedgerImage } from '../../lib/ledgerImage.js'
import { shareImage } from '../../lib/share.js'

export default function Dealers() {
  const { auth } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [data, setData] = useState(null)
  const [collectors, setCollectors] = useState([])
  const [editing, setEditing] = useState(null)
  const [ledgerOf, setLedgerOf] = useState(null)
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')
  const [dupes, setDupes] = useState([])

  const reload = () => { api.dealers().then(setData); if (isAdmin) api.dealerDuplicates().then(setDupes).catch(() => setDupes([])) }
  useEffect(() => { reload(); api.selectableUsers().then((us) => setCollectors(us.filter((u) => u.role === 'collector'))) }, [])

  if (ledgerOf) return <Ledger dealer={ledgerOf} onBack={() => { setLedgerOf(null); reload() }} />
  if (!data) return <><SectionH>Dealers</SectionH><SkeletonList rows={6} /></>
  const del = async (id) => { if (await confirmDialog('Delete this dealer and its ledger?', { danger: true, confirmLabel: 'Delete' })) { await api.delDealer(id); reload(); toast.success('Dealer deleted') } }

  return (
    <>
      <SectionH onAdd={() => setEditing({})}>Dealers</SectionH>
      <div className="grid grid-cols-2 gap-3 mb-4 stagger">
        <Card n={inr(data.reduce((s, d) => s + d.outstanding, 0))} l="Total outstanding" />
        <Card n={data.length} l="Dealers" />
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setModal('pdf')} className="flex-1 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl py-2.5 flex items-center justify-center gap-1.5 shadow-soft transition-colors"><FileText size={14} />Bill from PDF</button>
        {isAdmin && <button onClick={() => setModal('bulk')} className="flex-1 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl py-2.5 flex items-center justify-center gap-1.5 shadow-soft transition-colors"><Upload size={14} />Bulk bills</button>}
      </div>
      {isAdmin && dupes.length > 0 && (
        <button data-testid="review-duplicates-btn" onClick={() => setModal('merge')} className="w-full mb-3 text-[12px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-colors">
          <GitMerge size={14} />Review {dupes.length} possible duplicate dealer{dupes.length > 1 ? 's' : ''}
        </button>
      )}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dealer or area…"
          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white text-base outline-none transition-colors focus:border-brand-500" />
      </div>
      {data.length === 0 ? (
        <EmptyState icon={Store} title="No dealers yet" hint="Add your first dealer, or import a MARG statement to build their full ledger in one go." />
      ) : (
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {data.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()) || (d.area || '').toLowerCase().includes(q.toLowerCase())).map((d) => {
          const over = d.outstanding > d.credit_limit && d.credit_limit > 0
          return (
            <div key={d.id} className="group bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
              <button onClick={() => setLedgerOf(d)} className="w-full flex justify-between items-center text-left">
                <div className="min-w-0 pr-2">
                  <div className="text-[15px] font-semibold text-slate-900 truncate">{d.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.area || '—'}</div>
                  {over && <Pill tone="over">Over limit</Pill>}
                  {d.ageing?.age_90p > 0 && <Pill tone="old">90+ dues</Pill>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={'font-display text-[16px] font-bold tracking-tight ' + (d.outstanding === 0 ? 'text-brand-700' : 'text-slate-900')}>{inr(d.outstanding)}</div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
              <RowActions onEdit={() => setEditing(d)} onDel={isAdmin ? () => del(d.id) : null} />
            </div>
          )
        })}
      </div>
      )}
      {editing && <DealerForm dealer={editing} collectors={collectors} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {modal === 'bulk' && <BulkModal onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
      {modal === 'pdf' && <PdfModal dealers={data} onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
      {modal === 'merge' && <MergeModal groups={dupes} onClose={() => setModal(null)} onMerged={reload} />}
    </>
  )
}

function MergeModal({ groups, onClose, onMerged }) {
  return (
    <Modal title="Possible duplicate dealers" onClose={onClose}>
      {!groups.length ? (
        <div className="text-[13px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">No more duplicates — nice and clean. <button onClick={onClose} className="font-semibold text-emerald-700 hover:underline">Close</button></div>
      ) : (
        <>
          <div className="text-[12px] text-slate-500 mb-3">These look like the same shop. Pick the one to <b>keep</b> — its ledger absorbs the others, then the duplicates are removed.</div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {groups.map((g) => <MergeGroup key={g.key} g={g} onMerged={onMerged} />)}
          </div>
        </>
      )}
    </Modal>
  )
}

function MergeGroup({ g, onMerged }) {
  const [keep, setKeep] = useState(g.dealers[0].id)
  const [busy, setBusy] = useState(false)
  const merge = async () => {
    const sources = g.dealers.filter((d) => d.id !== keep).map((d) => d.id)
    if (!sources.length) return
    setBusy(true)
    try { await api.mergeDealers(keep, sources); toast.success('Dealers merged'); onMerged() }
    catch (e) { toast.error(e.message); setBusy(false) }
  }
  return (
    <div data-testid={'merge-group-' + g.key} className="border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{g.reason === 'phone' ? 'Same phone number' : 'Same name'}</div>
      {g.dealers.map((d) => (
        <label key={d.id} className="flex items-center gap-2 py-1 text-[13px] cursor-pointer">
          <input type="radio" name={'keep-' + g.key} checked={keep === d.id} onChange={() => setKeep(d.id)} />
          <span className="flex-1 min-w-0 truncate"><b className="text-slate-800">{d.name}</b> <span className="text-slate-400">· {d.phone || 'no phone'} · {inr(d.outstanding)} · {d.bills} bill(s)</span></span>
        </label>
      ))}
      <button data-testid="merge-group-btn" onClick={merge} disabled={busy} className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold py-2 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5">
        {busy && <Loader2 size={14} className="animate-spin" />}Keep selected &amp; merge the rest
      </button>
    </div>
  )
}

function Ledger({ dealer, onBack }) {
  const { auth, company } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [led, setLed] = useState(null)
  const [modal, setModal] = useState(null)
  const [billView, setBillView] = useState(null)
  const [visited, setVisited] = useState(dealer.visited_today)
  const [marking, setMarking] = useState(false)
  const canCollect = isAdmin || (auth.user.role === 'manager' && auth.user.can_collect)
  const canSeed = isAdmin || (auth.user.role === 'manager' && auth.user.can_import_statement && (led ? led.entries.length === 0 : false))
  const shareStatement = async () => {
    const blob = await renderLedgerImage({ company: company?.name, dealer: led.dealer, outstanding: led.outstanding, ageing: led.ageing, lastPayment: led.last_payment, entries: led.entries })
    const res = await shareImage(blob, (led.dealer || 'statement') + '.png', led.dealer + ' — outstanding ' + inr(led.outstanding))
    if (res === 'downloaded') toast.info('Image saved — attach it in WhatsApp')
  }
  const load = () => api.dealerLedger(dealer.id).then(setLed)
  useEffect(() => { load() }, [dealer.id])
  if (!led) return <Spin />
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600 -ml-1">‹ Dealers</button>
        <button disabled={marking} onClick={async () => { if (!visited) { setMarking(true); const loc = await getPosition(); await api.markVisited(dealer.id, loc || {}); setVisited(true); setMarking(false) } }}
          className={'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-70 ' + (visited ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white')}>
          {visited ? 'Visited \u2713' : marking ? 'Locating\u2026' : 'Mark visited'}
        </button>
      </div>
      <LedgerHeader name={led.dealer} outstanding={led.outstanding} ageing={led.ageing} creditLimit={led.credit_limit} lastPayment={led.last_payment} />
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setModal('bill')} className="flex-1 min-w-[30%] bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white text-[13px] font-semibold py-2.5 rounded-xl shadow-glow transition-all">Add bill</button>
        {canCollect && led.outstanding > 0 && <button onClick={() => setModal('collect')} className="flex-1 min-w-[30%] bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors">Record payment</button>}
        {canSeed && <button onClick={() => setModal('statement')} className="flex-1 min-w-[30%] border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13px] font-semibold py-2.5 rounded-xl transition-colors">Import statement</button>}
        {led.outstanding > 0 && dealer.phone && <a href={waLink(dealer.phone, reminderText(led.dealer, led.outstanding, led.ageing))} target="_blank" rel="noreferrer" className="flex-1 min-w-[30%] text-center bg-[#25D366] text-white text-[13px] font-semibold py-2.5 rounded-lg">WhatsApp reminder</a>}
        <button onClick={shareStatement} className="flex-1 min-w-[30%] bg-[#075E54] text-white text-[13px] font-semibold py-2.5 rounded-lg">Share statement</button>
      </div>
      <div className="text-xs font-bold text-slate-600 mb-2 px-0.5">Ledger · oldest first</div>
      <LedgerTable entries={led.entries}
        onBill={async (e) => { try { setBillView(await api.billDetail(e.id)) } catch (err) { toast.error(err.message) } }}
        onDelete={isAdmin ? async (e) => {
          if (e.type === 'payment') {
            if (await confirmDialog('Delete this payment of ' + inr(e.credit) + '? The outstanding will go back up.', { danger: true, confirmLabel: 'Delete' })) { await api.deletePayment(e.id); load(); toast.success('Payment deleted') }
          } else if (await confirmDialog('Delete bill ' + (e.ref || '') + ' of ' + inr(e.debit) + '? This removes it from the ledger' + (e.source === 'sale_csv' ? ' and returns its stock to inventory' : '') + '.', { danger: true, confirmLabel: 'Delete' })) {
            await api.deleteBill(e.id); load(); toast.success('Bill deleted')
          }
        } : undefined} />
      {billView && <BillLinesModal bill={billView} onClose={() => setBillView(null)} />}
      {modal === 'bill' && <BillModal dealer={dealer} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />}
      {modal === 'statement' && <StatementModal dealer={dealer} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />}
      {modal === 'collect' && <CollectModal dealer={dealer} outstanding={led.outstanding} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />}
    </>
  )
}

function BillLinesModal({ bill, onClose }) {
  const lines = bill.lines || []
  return (
    <Modal title={'Bill ' + (bill.bill_no || '')} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">{bill.date || '—'} · total <b className="text-slate-800">{inr(bill.amount)}</b>{bill.source ? ` · ${bill.source.replace('_', ' ')}` : ''}</div>
      {lines.length ? (
        <div data-testid="bill-lines" className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-800 truncate">{l.model || '—'}</div>
                <div className="text-[11px] text-slate-400">{[l.brand, l.qty ? 'qty ' + l.qty : null, l.imei].filter(Boolean).join(' · ')}</div>
              </div>
              <span className="font-bold text-slate-900 shrink-0">{inr(l.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">No line items recorded for this bill (added manually, from a statement or a PDF). Billed amount: <b className="text-slate-800">{inr(bill.amount)}</b></div>
      )}
    </Modal>
  )
}

function CollectModal({ dealer, outstanding, onClose, onDone }) {  const [f, setF] = useState({ amount: '', mode: 'RTGS', cheque: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    const a = parseInt(f.amount || 0)
    if (!a || a <= 0) return toast.error('Enter an amount')
    if (a > outstanding) return toast.error('Amount exceeds outstanding of ' + inr(outstanding))
    if (f.mode === 'Cheque' && !f.cheque.trim()) return toast.error('Enter cheque details')
    setBusy(true)
    try { await api.collect({ dealer_id: dealer.id, amount: a, mode: f.mode, cheque: f.cheque }); toast.success('Payment recorded'); onDone() }
    catch (err) { toast.error(err.message); setBusy(false) }
  }
  return (
    <Modal title={'Record payment — ' + dealer.name} onClose={onClose}>
      <Field label="Amount received" value={f.amount} onChange={(v) => set('amount', v)} type="number" />
      <div className="text-xs font-semibold text-slate-600 mb-1.5">Mode</div>
      <div className="flex gap-2 mb-3">
        {['RTGS', 'Cash', 'Cheque', 'UPI'].map((m) => (
          <button key={m} onClick={() => set('mode', m)}
            className={'flex-1 py-2.5 rounded-lg text-[12px] font-semibold border ' + (f.mode === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{m}</button>
        ))}
      </div>
      {f.mode === 'Cheque' && <Field label="Cheque no. & bank" value={f.cheque} onChange={(v) => set('cheque', v)} />}
      <div className="text-[11px] text-slate-500 mb-3">Applied to oldest dues first.</div>
      <button onClick={save} disabled={busy} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60">Save payment</button>
    </Modal>
  )
}

function DealerForm({ dealer, collectors, onClose, onSaved }) {
  const [f, setF] = useState({
    name: dealer.name || '', area: dealer.area || '', phone: dealer.phone || '',
    credit_limit: dealer.credit_limit || '', collector_id: dealer.collector_id || '', opening_balance: '',
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.name.trim()) return toast.error('Name is required')
    await api.saveDealer({
      id: dealer.id, name: f.name.trim(), area: f.area, phone: f.phone,
      credit_limit: +f.credit_limit || 0, collector_id: f.collector_id || null,
      ...(dealer.id ? {} : { opening_balance: +f.opening_balance || 0 }),
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
      <Field label="Credit limit \u20b9" value={f.credit_limit} onChange={(v) => set('credit_limit', v)} type="number" />
      <Select label="Assign collector" value={f.collector_id} onChange={(v) => set('collector_id', v)}
        options={[['', '\u2014 unassigned \u2014'], ...collectors.map((c) => [c.id, c.name])]} />
      {!dealer.id && <Field label="Opening balance \u20b9 (optional)" value={f.opening_balance} onChange={(v) => set('opening_balance', v)} type="number" />}
      <div className="text-[11px] text-slate-400 mb-2">Tip: for full history, add the dealer, open it, then use \u201cImport statement\u201d.</div>
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-1">Save</button>
    </Modal>
  )
}

function BillModal({ dealer, onClose, onDone }) {
  const [f, setF] = useState({ bill_no: '', date: new Date().toISOString().slice(0, 10), amount: '' })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.bill_no.trim() || !(+f.amount > 0)) return toast.error('Enter bill number and amount')
    try { await api.addBill(dealer.id, { bill_no: f.bill_no.trim(), date: f.date, amount: +f.amount }); toast.success('Bill added'); onDone() }
    catch (err) { toast.error(err.message) }
  }
  return (
    <Modal title={'Add bill \u2014 ' + dealer.name} onClose={onClose}>
      <Field label="Bill / invoice no." value={f.bill_no} onChange={(v) => set('bill_no', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" value={f.date} onChange={(v) => set('date', v)} />
        <Field label="Amount \u20b9" value={f.amount} onChange={(v) => set('amount', v)} type="number" />
      </div>
      <button onClick={save} className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-1">Save bill</button>
    </Modal>
  )
}

function StatementModal({ dealer, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [parsed, setParsed] = useState(null)
  const fileRef = useRef(null)
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('')
    try { setParsed(parseStatement(await file.arrayBuffer())) }
    catch (err) { setMsg(err.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const confirm = async () => {
    setBusy(true)
    await api.seedDealer(dealer.id, { opening: parsed.opening, opening_date: parsed.opening_date, bills: parsed.bills, payments: parsed.payments })
    toast.success('Statement imported'); onDone()
  }
  return (
    <Modal title={'Import statement \u2014 ' + dealer.name} onClose={onClose}>
      <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        Seeds this dealer's ledger once and replaces existing bills/payments. Don't re-import after collectors start recording payments.
      </div>
      {!parsed ? (
        <>
          {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
          <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={pick} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Choose statement Excel
          </button>
        </>
      ) : (
        <>
          <div className="text-[13px] text-slate-600 mb-3">
            Found <b>{parsed.bills.length} bills</b> and <b>{parsed.payments.length} payments</b>
            {parsed.dealer_name ? <> for <b>{parsed.dealer_name}</b></> : null}. Opening {inr(parsed.opening)}.
          </div>
          <button onClick={confirm} disabled={busy}
            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />}Seed ledger for {dealer.name}
          </button>
        </>
      )}
    </Modal>
  )
}

function BulkModal({ onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('')
    try {
      const rows = parseBulkBills(await file.arrayBuffer())
      if (!rows.length) { setMsg('No rows found \u2014 check the columns.'); setBusy(false); return }
      const res = await api.bulkBills(rows)
      setMsg('Added ' + res.added + ' bills.' + (res.unmatched?.length ? ' Unmatched: ' + res.unmatched.join(', ') : ''))
      if (!res.unmatched?.length) setTimeout(onDone, 900)
    } catch (err) { setMsg(err.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  return (
    <Modal title="Bulk add bills" onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-2">Columns: Dealer, Bill No, Date, Amount. Matched by dealer name.</div>
      <button onClick={downloadBillsTemplate} className="text-[12px] font-semibold text-emerald-700 flex items-center gap-1 mb-3"><Download size={13} />Download template</button>
      {msg && <div className="text-[12px] text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
      <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={pick} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Choose Excel
      </button>
    </Modal>
  )
}

function PdfModal({ dealers, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [parsed, setParsed] = useState(null)
  const [dealerId, setDealerId] = useState('')
  const fileRef = useRef(null)
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('')
    try {
      const p = await api.parseInvoice(file)
      setParsed(p)
      const match = dealers.find((d) => d.name.trim().toLowerCase() === (p.party || '').trim().toLowerCase())
        || dealers.find((d) => (p.party || '').toLowerCase().includes(d.name.toLowerCase().split(' ')[0]))
      setDealerId(match ? match.id : '')
    } catch (err) { setMsg(err.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const save = async () => {
    if (!dealerId) return toast.error('Pick the dealer this bill belongs to')
    setBusy(true)
    try {
      await api.addBill(dealerId, { bill_no: parsed.bill_no, date: parsed.date || new Date().toISOString().slice(0, 10), amount: parsed.amount, source: 'pdf' })
      toast.success('Bill added'); onDone()
    } catch (err) { toast.error(err.message); setBusy(false) }
  }
  return (
    <Modal title="Add bill from invoice PDF" onClose={onClose}>
      {!parsed ? (
        <>
          <div className="text-[12px] text-slate-500 mb-3">Upload a MARG invoice PDF \u2014 the app reads bill no, date and amount, then you confirm.</div>
          {msg && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
          <input ref={fileRef} type="file" accept=".pdf" onChange={pick} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}Choose PDF
          </button>
        </>
      ) : (
        <>
          <div className="text-[13px] text-slate-600 mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
            From PDF \u2014 Bill <b>{parsed.bill_no}</b>, {parsed.date}, <b>{inr(parsed.amount)}</b>{parsed.party ? <> \u00b7 party \u201c{parsed.party}\u201d</> : null}
          </div>
          <Select label="Dealer" value={dealerId} onChange={setDealerId}
            options={[['', '\u2014 pick dealer \u2014'], ...dealers.map((d) => [d.id, d.name])]} />
          <button onClick={save} disabled={busy}
            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
            {busy && <Loader2 size={16} className="animate-spin" />}Add this bill
          </button>
        </>
      )}
    </Modal>
  )
}

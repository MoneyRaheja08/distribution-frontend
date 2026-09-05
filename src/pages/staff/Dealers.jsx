import { useEffect, useRef, useState } from 'react'
import { Loader2, Upload, FileText, Download } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { parseStatement, parseBulkBills, downloadBillsTemplate } from '../../lib/statement.js'
import { Spin, SectionH, RowActions, Pill, Modal, Field, Select } from '../../components/ui.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function Dealers() {
  const { auth } = useAuth()
  const isAdmin = auth.user.role === 'admin'
  const [data, setData] = useState(null)
  const [collectors, setCollectors] = useState([])
  const [editing, setEditing] = useState(null)
  const [ledgerOf, setLedgerOf] = useState(null)
  const [modal, setModal] = useState(null)

  const reload = () => api.dealers().then(setData)
  useEffect(() => { reload(); api.selectableUsers().then((us) => setCollectors(us.filter((u) => u.role === 'collector'))) }, [])

  if (ledgerOf) return <Ledger dealer={ledgerOf} onBack={() => { setLedgerOf(null); reload() }} />
  if (!data) return <Spin />
  const del = async (id) => { if (confirm('Delete this dealer and its ledger?')) { await api.delDealer(id); reload() } }

  return (
    <>
      <SectionH onAdd={() => setEditing({})}>Dealers</SectionH>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setModal('pdf')} className="flex-1 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-lg py-2 flex items-center justify-center gap-1"><FileText size={13} />Bill from PDF</button>
        <button onClick={() => setModal('bulk')} className="flex-1 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-lg py-2 flex items-center justify-center gap-1"><Upload size={13} />Bulk bills</button>
      </div>
      <div className="space-y-2">
        {data.length === 0 && <div className="text-center text-slate-400 text-sm py-10 bg-white border border-dashed border-slate-200 rounded-xl">No dealers yet. Tap Add, or import a statement.</div>}
        {data.map((d) => {
          const over = d.outstanding > d.credit_limit && d.credit_limit > 0
          return (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <button onClick={() => setLedgerOf(d)} className="w-full flex justify-between items-center text-left">
                <div>
                  <div className="text-[15px] font-semibold">{d.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.area || '—'}</div>
                  {over && <Pill tone="over">Over limit</Pill>}
                  {d.ageing?.age_90p > 0 && <Pill tone="old">90+ dues</Pill>}
                </div>
                <div className="text-[15px] font-bold">{inr(d.outstanding)}</div>
              </button>
              <RowActions onEdit={() => setEditing(d)} onDel={isAdmin ? () => del(d.id) : null} />
            </div>
          )
        })}
      </div>
      {editing && <DealerForm dealer={editing} collectors={collectors} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {modal === 'bulk' && <BulkModal onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
      {modal === 'pdf' && <PdfModal dealers={data} onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
    </>
  )
}

function Ledger({ dealer, onBack }) {
  const [led, setLed] = useState(null)
  const [modal, setModal] = useState(null)
  const load = () => api.dealerLedger(dealer.id).then(setLed)
  useEffect(() => { load() }, [dealer.id])
  if (!led) return <Spin />
  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">‹ Dealers</button>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <div className="text-lg font-bold">{led.dealer}</div>
        <div className="text-[13px] text-slate-500 mt-1">Outstanding <b className="text-slate-900">{inr(led.outstanding)}</b></div>
        {led.last_payment && <div className="text-[12px] text-slate-500">Last payment {inr(led.last_payment.amount)} · {led.last_payment.date}</div>}
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setModal('bill')} className="flex-1 bg-emerald-700 text-white text-[13px] font-semibold py-2.5 rounded-lg">Add bill</button>
        <button onClick={() => setModal('statement')} className="flex-1 border border-slate-200 text-slate-600 text-[13px] font-semibold py-2.5 rounded-lg">Import statement</button>
      </div>
      <div className="text-xs font-bold text-slate-600 mb-2 px-0.5">Ledger</div>
      <div className="bg-white border border-slate-200 rounded-xl p-2">
        {led.entries.length === 0 ? <div className="text-[12px] text-slate-400 p-3">No entries yet. Import the statement to seed the ledger.</div> :
          led.entries.slice().reverse().map((e, i) => (
            <div key={i} className="flex justify-between items-center px-2 py-2 border-b border-slate-100 last:border-0 text-[13px]">
              <div className="text-slate-500 min-w-0">
                <span className="text-slate-900 font-semibold block truncate">{e.type === 'bill' ? 'Bill ' + e.ref : (e.mode || 'Payment') + (e.ref ? ' ' + e.ref : '')}</span>
                {e.date}
              </div>
              <div className="text-right shrink-0 pl-2">
                <div className={'font-bold ' + (e.debit ? 'text-slate-800' : 'text-emerald-700')}>{e.debit ? inr(e.debit) : '\u2212 ' + inr(e.credit)}</div>
                <div className="text-[10px] text-slate-400">bal {inr(e.balance)}</div>
              </div>
            </div>
          ))}
      </div>
      {modal === 'bill' && <BillModal dealer={dealer} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />}
      {modal === 'statement' && <StatementModal dealer={dealer} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />}
    </>
  )
}

function DealerForm({ dealer, collectors, onClose, onSaved }) {
  const [f, setF] = useState({
    name: dealer.name || '', area: dealer.area || '', phone: dealer.phone || '',
    credit_limit: dealer.credit_limit || '', collector_id: dealer.collector_id || '', opening_balance: '',
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.name.trim()) return alert('Name is required')
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
    if (!f.bill_no.trim() || !(+f.amount > 0)) return alert('Enter bill number and amount')
    await api.addBill(dealer.id, { bill_no: f.bill_no.trim(), date: f.date, amount: +f.amount })
    onDone()
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
    onDone()
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
    if (!dealerId) return alert('Pick the dealer this bill belongs to')
    setBusy(true)
    await api.addBill(dealerId, { bill_no: parsed.bill_no, date: parsed.date || new Date().toISOString().slice(0, 10), amount: parsed.amount })
    onDone()
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

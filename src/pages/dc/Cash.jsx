import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { niceDate } from './bits.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin, Modal } from '../../components/ui.jsx'
import { Hero, ListCard, Row, Chip, PageHead, Section, Field, inp, PrimaryBtn } from './bits.jsx'

export default function Cash() {
  const { auth } = useAuth()
  const [data, setData] = useState(null)
  const [hist, setHist] = useState({})
  const [open, setOpen] = useState({})
  const [hand, setHand] = useState(null)
  const load = () => {
    api.dcCash().then(setData)
    api.dcHandovers().then((r) => {
      const g = {}
      ;(r.rows || []).forEach((h) => { (g[h.staff_id] = g[h.staff_id] || []).push(h) })
      setHist(g)
    })
  }
  useEffect(() => { load() }, [])
  if (!data) return <Spin />
  const isAdmin = data.is_admin
  const seesAll = data.sees_all
  const me = data.rows.find((r) => r.staff_id === auth.user.id)
  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }))
  return (
    <>
      <PageHead title="Cash in hand" sub={seesAll ? 'Live drawer for every staff member' : 'Your live cash drawer'} />
      <Hero eyebrow={seesAll ? 'Total cash held by staff' : 'Your cash in hand'} value={inr(seesAll ? data.total : (me?.cash_in_hand || 0))}
        sub={seesAll ? data.rows.length + ' staff · rebuilt from records' : 'rebuilt from your bills, receipts & expenses'} testid="dc-cash-hero" />
      {!seesAll && me && <><Breakdown c={me} /><HistoryList rows={hist[me.staff_id]} /></>}
      {seesAll && (
        <div className="mt-4">
          <ListCard empty="No staff cash activity yet." testid="dc-cash-list">
            {data.rows.map((r) => {
              const hs = hist[r.staff_id] || []
              return (
                <Row key={r.staff_id} testid={'dc-cash-' + r.staff_id} title={r.name || '—'} tone={r.cash_in_hand > 0 ? 'bg-emerald-500' : 'bg-slate-300'}
                  right={<div className="flex items-center gap-2">
                    <div className="text-[15px] font-bold text-slate-900">{inr(r.cash_in_hand)}</div>
                    {isAdmin && r.cash_in_hand > 0 && <button data-testid={'dc-handover-' + r.staff_id} onClick={() => setHand(r)} className="text-[12px] font-bold text-white bg-slate-900 hover:bg-brand-600 rounded-lg px-3 py-1.5 transition-colors">Receive</button>}
                  </div>}>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Chip tone="text-emerald-700 bg-emerald-50 ring-emerald-100">bills {inr(r.bills_cash)}</Chip>
                    {r.receipts_cash > 0 && <Chip>receipts {inr(r.receipts_cash)}</Chip>}
                    {r.resale_cash > 0 && <Chip>resale {inr(r.resale_cash)}</Chip>}
                    {r.expenses > 0 && <Chip tone="text-rose-700 bg-rose-50 ring-rose-200">− exp {inr(r.expenses)}</Chip>}
                    {r.handover > 0 && <Chip tone="text-slate-600 bg-slate-100 ring-slate-200">− given {inr(r.handover)}</Chip>}
                  </div>
                  {hs.length > 0 && (
                    <button data-testid={'dc-hist-toggle-' + r.staff_id} onClick={() => toggle(r.staff_id)} className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-slate-500 hover:text-slate-700">
                      {open[r.staff_id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{hs.length} handover{hs.length > 1 ? 's' : ''} to admin · {inr(hs.reduce((s, h) => s + h.amount, 0))}
                    </button>
                  )}
                  {open[r.staff_id] && <HistoryRows rows={hs} testid={'dc-hist-' + r.staff_id} />}
                </Row>
              )
            })}
          </ListCard>
        </div>
      )}
      {hand && <HandoverSheet r={hand} onClose={() => setHand(null)} onDone={() => { setHand(null); load() }} />}
    </>
  )
}

function HistoryRows({ rows, testid }) {
  return (
    <div data-testid={testid} className="mt-2 rounded-xl bg-slate-50 border border-slate-200/70 divide-y divide-slate-200/70">
      {rows.map((h) => (
        <div key={h.id} className="flex items-center justify-between px-3 py-2 text-[12px]">
          <span className="text-slate-500">{niceDate(h.date)}{h.by_name ? ' · to ' + h.by_name : ''}{h.note ? ' · ' + h.note : ''}</span>
          <span className="font-semibold text-slate-700">{inr(h.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function HistoryList({ rows }) {
  if (!rows || rows.length === 0) return null
  return (
    <Section title="Your handovers to admin">
      <ListCard testid="dc-my-handovers">
        {rows.map((h) => (
          <Row key={h.id} title={inr(h.amount)} sub={niceDate(h.date) + (h.by_name ? ' · received by ' + h.by_name : '') + (h.note ? ' · ' + h.note : '')} tone="bg-slate-400" />
        ))}
      </ListCard>
    </Section>
  )
}

function Breakdown({ c }) {
  const L = ({ k, v, tone = 'text-slate-900' }) => <div className="flex justify-between px-3.5 py-2.5"><span className="text-slate-500">{k}</span><span className={'font-semibold ' + tone}>{v}</span></div>
  return (
    <div className="mt-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft divide-y divide-slate-100 text-[13px]" data-testid="dc-cash-breakdown">
      <L k="Cash from bills" v={inr(c.bills_cash)} />
      <L k="+ Cash receipts (pending collected)" v={inr(c.receipts_cash)} />
      <L k="+ Exchange resale" v={inr(c.resale_cash)} />
      <L k="− Expenses spent" v={inr(c.expenses)} tone="text-rose-700" />
      <L k="− Handed to admin" v={inr(c.handover)} tone="text-slate-600" />
      <div className="flex justify-between px-3.5 py-3 bg-slate-50"><span className="font-bold text-slate-700">Cash in hand</span><span className="font-display text-lg font-bold text-emerald-700">{inr(c.cash_in_hand)}</span></div>
    </div>
  )
}

function HandoverSheet({ r, onClose, onDone }) {
  const [amt, setAmt] = useState(String(r.cash_in_hand))
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!(+amt > 0)) return toast.error('Enter amount')
    if (+amt > r.cash_in_hand) return toast.error('Cannot exceed ' + inr(r.cash_in_hand))
    setBusy(true)
    try { await api.dcHandover({ staff_id: r.staff_id, amount: +amt }); toast.success('Received ' + inr(+amt) + ' from ' + r.name); onDone() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={'Receive cash from ' + r.name} onClose={onClose}>
      <div className="flex justify-between text-[13px] bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 mb-4"><span className="text-emerald-800">Their cash in hand</span><span className="font-bold text-emerald-900">{inr(r.cash_in_hand)}</span></div>
      <Field label="Amount to receive"><input data-testid="dc-handover-amt" autoFocus className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
      <div className="text-[12px] text-slate-500 mt-2">This reduces {r.name}'s cash in hand and records the handover to you.</div>
      <div className="mt-5"><PrimaryBtn testid="dc-handover-save" onClick={save} disabled={busy}>Receive {inr(+amt || 0)}</PrimaryBtn></div>
    </Modal>
  )
}

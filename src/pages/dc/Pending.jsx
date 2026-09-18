import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { waLink } from '../../lib/whatsapp.js'
import { Spin, Modal } from '../../components/ui.jsx'
import { Hero, ListCard, Row, Chip, PageHead, Field, inp, MODES, PrimaryBtn, today, niceDate } from './bits.jsx'

const ageDays = (d) => Math.max(0, Math.floor((Date.now() - new Date(d + 'T00:00:00')) / 86400000))

export default function Pending() {
  const [data, setData] = useState(null)
  const [sel, setSel] = useState(null)
  const [q, setQ] = useState('')
  const from = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const load = () => api.dcPending('?frm=' + from + '&to=' + today()).then(setData)
  useEffect(() => { load() }, []) // eslint-disable-line
  if (!data) return <Spin />
  const rows = data.rows.filter((b) => !q || JSON.stringify(b).toLowerCase().includes(q.toLowerCase()))
  const old = data.rows.filter((b) => ageDays(b.date) > 30).reduce((s, b) => s + b.pending, 0)
  return (
    <>
      <PageHead title="Pending" sub="Money customers still owe" />
      <Hero eyebrow="Total pending" value={inr(data.total || 0)} sub={(data.count || 0) + ' bills' + (old > 0 ? ' · ' + inr(old) + ' older than 30 days' : '')} testid="dc-pending-hero" />
      <input data-testid="dc-pending-search" className={inp + ' mt-4 shadow-soft'} placeholder="Search customer, phone, bill…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3">
        <ListCard empty="No pending payments. Everything is collected!" testid="dc-pending-list">
          {rows.map((b) => {
            const age = ageDays(b.date)
            return (
              <Row key={b.id} title={b.customer || 'Walk-in'} sub={[niceDate(b.date), b.bill_no && '#' + b.bill_no, b.staff].filter(Boolean).join(' · ')}
                tone={age > 30 ? 'bg-red-500' : age > 7 ? 'bg-amber-400' : 'bg-slate-300'}
                right={<div className="flex items-center gap-2">
                  {b.phone && <a href={waLink(b.phone, `Dear ${b.customer || 'Customer'}, a gentle reminder: ${inr(b.pending)} is pending against bill ${b.bill_no || ''}. Kindly arrange payment. Thank you.`)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-600 hover:bg-emerald-50 rounded-lg p-1.5"><MessageCircle size={17} /></a>}
                  <button data-testid={'dc-collect-' + b.id} onClick={() => setSel(b)} className="text-[12px] font-bold text-white bg-slate-900 hover:bg-brand-600 rounded-lg px-3 py-1.5 transition-colors">Collect</button>
                </div>}>
                <div className="flex gap-1 mt-1.5"><Chip tone="text-amber-800 bg-amber-100 ring-amber-200">{inr(b.pending)} due</Chip><Chip>{age === 0 ? 'today' : age + 'd old'}</Chip></div>
              </Row>
            )
          })}
        </ListCard>
      </div>
      {sel && <CollectSheet b={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); load() }} />}
    </>
  )
}

function CollectSheet({ b, onClose, onDone }) {
  const [amt, setAmt] = useState(String(b.pending))
  const [mode, setMode] = useState('cash')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!(+amt > 0)) return toast.error('Enter amount')
    setBusy(true)
    try { await api.dcCollect(b.id, { amount: +amt, mode }); toast.success('Recorded ' + inr(+amt)); onDone() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={'Collect from ' + (b.customer || 'Walk-in')} onClose={onClose}>
      <div className="flex justify-between text-[13px] bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 mb-4"><span className="text-amber-800">Pending on bill {b.bill_no ? '#' + b.bill_no : ''}</span><span className="font-bold text-amber-900">{inr(b.pending)}</span></div>
      <Field label="Amount received"><input data-testid="dc-collect-amt" autoFocus className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
      <div className="text-[12px] font-semibold text-slate-600 mt-4 mb-1.5">Payment mode</div>
      <div className="grid grid-cols-5 gap-1.5">
        {MODES.map(([k, l, bar]) => (
          <button key={k} data-testid={'dc-collect-mode-' + k} onClick={() => setMode(k)} className={'rounded-xl py-2 text-[12px] font-bold border transition-all ' + (mode === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>
            <span className={'mx-auto mb-1 block h-1.5 w-1.5 rounded-full ' + bar} />{l}
          </button>
        ))}
      </div>
      {+amt < b.pending && +amt > 0 && <div className="text-[12px] text-slate-500 mt-3">{inr(b.pending - +amt)} will remain pending.</div>}
      <div className="mt-5"><PrimaryBtn testid="dc-collect-save" onClick={save} disabled={busy}>Record {inr(+amt || 0)}</PrimaryBtn></div>
    </Modal>
  )
}

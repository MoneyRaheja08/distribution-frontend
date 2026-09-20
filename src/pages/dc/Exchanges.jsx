import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { confirmDialog } from '../../lib/confirm.js'
import { inr } from '../../lib/format.js'
import { Spin, Modal } from '../../components/ui.jsx'
import { Hero, ListCard, Row, Chip, PageHead, Field, inp, MODES, PrimaryBtn } from './bits.jsx'

const TABS = [['', 'All'], ['in_stock', 'In stock'], ['resold', 'Resold'], ['godown', 'Godown-1']]
const statusChip = (s) => s === 'resold' ? 'text-emerald-700 bg-emerald-50 ring-emerald-100' : s === 'godown' ? 'text-slate-600 bg-slate-100 ring-slate-200' : 'text-amber-800 bg-amber-100 ring-amber-200'
const statusLabel = (s) => s === 'resold' ? 'Resold' : s === 'godown' ? 'Godown-1' : 'In stock'

export default function Exchanges() {
  const [tab, setTab] = useState('')
  const [data, setData] = useState(null)
  const [sel, setSel] = useState(null)
  const load = () => api.dcExchanges(tab ? '?status=' + tab : '').then(setData)
  useEffect(() => { setData(null); load() }, [tab]) // eslint-disable-line
  const godown = async (x) => { if (await confirmDialog('Move ' + (x.model || 'this item') + ' to Godown-1?')) { await api.dcGodown(x.id); toast.success('Moved to Godown-1'); load() } }
  const del = async (x) => { if (await confirmDialog('Delete this exchange item?', { danger: true })) { await api.dcDeleteExchange(x.id); load() } }
  return (
    <>
      <PageHead title="Exchange stock" sub="Trade-in items taken from customers" />
      {!data ? <Spin /> : (
        <>
          <Hero eyebrow="Resale recovered" value={inr(data.summary.resale_total || 0)}
            sub={(data.summary.in_stock || 0) + ' in stock · ' + (data.summary.resold || 0) + ' resold · ' + (data.summary.godown || 0) + ' in Godown-1'} testid="dc-ex-hero" />
          <div className="flex flex-wrap gap-1.5 mt-4">
            {TABS.map(([k, l]) => <button key={k} data-testid={'dc-ex-tab-' + (k || 'all')} onClick={() => setTab(k)} className={'text-[12.5px] font-semibold rounded-full px-3.5 py-1.5 border transition-colors ' + (tab === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{l}</button>)}
          </div>
          <div className="mt-3">
            <ListCard empty="No exchange items here yet. Add one on a bill." testid="dc-ex-list">
              {data.rows.map((x) => (
                <Row key={x.id} testid={'dc-ex-' + x.id} title={(x.brand ? x.brand + ' ' : '') + (x.model || 'Item')} sub={[x.customer, x.note, x.staff].filter(Boolean).join(' · ')}
                  tone={x.status === 'resold' ? 'bg-emerald-500' : x.status === 'godown' ? 'bg-slate-400' : 'bg-amber-400'} onDelete={() => del(x)}
                  right={<div className="text-right">
                    {x.status === 'resold'
                      ? <div className="text-[15px] font-bold text-emerald-700">+{inr(x.resale_amount)}</div>
                      : x.resale_status === 'pending'
                        ? <div className="text-[12px] font-bold text-amber-700">+{inr(x.pending_amount)} pending</div>
                        : <div className="flex gap-1.5">
                          <button data-testid={'dc-ex-sell-' + x.id} onClick={() => setSel(x)} className="text-[12px] font-bold text-white bg-slate-900 hover:bg-brand-600 rounded-lg px-3 py-1.5 transition-colors">Resell</button>
                          {x.status !== 'godown' && <button data-testid={'dc-ex-godown-' + x.id} onClick={() => godown(x)} className="text-[12px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors">Godown</button>}
                        </div>}
                  </div>}>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Chip tone={statusChip(x.status)}>{statusLabel(x.status)}</Chip>
                    {x.resale_status === 'pending' && <Chip tone="text-amber-800 bg-amber-100 ring-amber-200">Resale awaiting approval</Chip>}
                    {x.value > 0 && x.status !== 'resold' && <Chip>est {inr(x.value)}</Chip>}
                  </div>
                </Row>
              ))}
            </ListCard>
          </div>
        </>
      )}
      {sel && <ResaleSheet x={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); load() }} />}
    </>
  )
}

function ResaleSheet({ x, onClose, onDone }) {
  const [amt, setAmt] = useState(x.value ? String(x.value) : '')
  const [mode, setMode] = useState('cash')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!(+amt > 0)) return toast.error('Enter resale amount')
    setBusy(true)
    try { await api.dcResale(x.id, { amount: +amt, mode }); toast.success('Resale recorded — credited to ' + (x.staff || 'seller')); onDone() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={'Resell ' + (x.model || 'item')} onClose={onClose}>
      <div className="text-[12px] text-slate-500 mb-3">Resale money is credited to <span className="font-semibold text-slate-700">{x.staff || 'the original seller'}</span>'s cash in hand.</div>
      <Field label="Resale amount"><input data-testid="dc-resale-amt" autoFocus className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" placeholder="₹ 0" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
      <div className="text-[12px] font-semibold text-slate-600 mt-4 mb-1.5">Payment mode</div>
      <div className="grid grid-cols-4 gap-1.5">
        {MODES.map(([k, l, bar]) => (
          <button key={k} data-testid={'dc-resale-mode-' + k} onClick={() => setMode(k)} className={'rounded-xl py-2 text-[12px] font-bold border transition-all ' + (mode === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>
            <span className={'mx-auto mb-1 block h-1.5 w-1.5 rounded-full ' + bar} />{l}
          </button>
        ))}
      </div>
      <div className="mt-5"><PrimaryBtn testid="dc-resale-save" onClick={save} disabled={busy}>Record resale {inr(+amt || 0)}</PrimaryBtn></div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Lock, Pencil } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'
import { confirmDialog } from '../../lib/confirm.js'
import { Hero, ModeBar, ListCard, Row, Chip, Fab, PageHead, DateNav, MODES, today, niceDate } from './bits.jsx'
import BillForm from './BillForm.jsx'

export default function Bills() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const [date, setDate] = useState(today())
  const [data, setData] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const load = () => api.dcBills('?date=' + date).then(setData)
  useEffect(() => { setData(null); load() }, [date]) // eslint-disable-line
  const del = async (b) => { if (await confirmDialog('Delete bill ' + (b.bill_no || b.customer || '') + '?', { danger: true })) { await api.dcDeleteBill(b.id); load() } }
  const open = (b) => { if (b.locked || Date.now() / 1000 > b.editable_until) return toast.info('Bill is locked — edits allowed only within 2 minutes of saving'); setEditing(b) }
  const t = data?.totals || {}
  return (
    <>
      <PageHead title="Bills" sub={niceDate(date)} right={<DateNav date={date} setDate={setDate} />} />
      {!data ? <Spin /> : (
        <>
          <Hero eyebrow="Collected" value={inr(t.total || 0)} sub={(t.bills || 0) + ' bills' + (t.pending ? ' · ' + inr(t.pending) + ' pending' : '') + (admin && t.profit != null ? ' · profit ' + inr(t.profit) : '')}>
            <ModeBar d={t} dark />
          </Hero>
          <div className="mt-4">
            <ListCard empty={'No bills on ' + niceDate(date).toLowerCase() + '. Tap New bill to add one.'} testid="dc-bill-list">
              {data.rows.map((b) => (
                <Row key={b.id} testid={'dc-row-' + b.id} title={(b.customer || 'Walk-in') + (b.bill_no ? ' · #' + b.bill_no : '')}
                  sub={[b.items?.[0]?.model, b.staff, admin && 'profit ' + inr(b.profit || 0)].filter(Boolean).join(' · ')}
                  tone={b.pending > 0 ? 'bg-amber-400' : 'bg-emerald-500'} onDelete={() => del(b)} onClick={() => open(b)}
                  right={<div className="flex items-center gap-1.5"><div className="text-[15px] font-bold text-slate-900">{inr(b.total)}</div>{(b.locked || Date.now() / 1000 > b.editable_until) ? <Lock size={12} className="text-slate-300" /> : <Pencil size={12} className="text-brand-600" />}</div>}>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {MODES.map(([k, l, , chip]) => +b[k] > 0 && <Chip key={k} tone={chip}>{l} {inr(b[k])}</Chip>)}
                    {b.pending > 0 && <Chip tone="text-amber-800 bg-amber-100 ring-amber-200">Pending {inr(b.pending)}</Chip>}
                  </div>
                </Row>
              ))}
            </ListCard>
          </div>
        </>
      )}
      <Fab label="New bill" testid="dc-fab-bill" onClick={() => setAdding(true)} />
      {adding && <BillForm date={date} admin={admin} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
      {editing && <BillForm date={date} admin={admin} bill={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </>
  )
}
